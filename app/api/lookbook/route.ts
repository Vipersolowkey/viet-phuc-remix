import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/lib/database";
import { lookSchema } from "@/lib/remix";
import { z } from "zod";
export const dynamic = "force-dynamic";
const reply = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
function validOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "sign_in_required" }, 401);
  try {
    const data = await database()
      .prepare(
        "SELECT payload FROM looks WHERE owner = ? ORDER BY created_at DESC, id LIMIT 100",
      )
      .bind(user.userId)
      .all<{ payload: string }>();
    return reply({
      looks: lookSchema
        .array()
        .parse(data.results.map((r) => JSON.parse(r.payload))),
    });
  } catch {
    return reply({ error: "lookbook_unavailable" }, 503);
  }
}
export async function POST(request: Request) {
  if (!validOrigin(request)) return reply({ error: "origin_rejected" }, 403);
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "sign_in_required" }, 401);
  let look;
  try {
    const raw = await request.text();
    if (raw.length > 5000) return reply({ error: "input_too_large" }, 413);
    look = lookSchema.parse(JSON.parse(raw));
  } catch {
    return reply({ error: "invalid_look" }, 400);
  }
  try {
    const db = database();
    const exists = await db
      .prepare("SELECT id FROM looks WHERE owner = ? AND id = ?")
      .bind(user.userId, look.id)
      .first();
    if (exists) return reply({ look });
    const result = await db
      .prepare(
        "INSERT OR IGNORE INTO looks (owner, id, payload, created_at) SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM looks WHERE owner = ?) < 100",
      )
      .bind(user.userId, look.id, JSON.stringify(look), Date.now(), user.userId)
      .run();
    if (!result.meta.changes) return reply({ error: "lookbook_full" }, 409);
    return reply({ look }, 201);
  } catch {
    return reply({ error: "lookbook_unavailable" }, 503);
  }
}
export async function DELETE(request: Request) {
  if (!validOrigin(request)) return reply({ error: "origin_rejected" }, 403);
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "sign_in_required" }, 401);
  let id;
  try {
    id = z
      .string()
      .min(1)
      .max(100)
      .parse(new URL(request.url).searchParams.get("id"));
  } catch {
    return reply({ error: "invalid_id" }, 400);
  }
  try {
    const db = database();
    await db.batch([
      db.prepare("DELETE FROM collection_items WHERE owner = ? AND look_id = ?").bind(user.userId, id),
      db.prepare("DELETE FROM looks WHERE owner = ? AND id = ?").bind(user.userId, id),
    ]);
    return reply({ deleted: id });
  } catch {
    return reply({ error: "lookbook_unavailable" }, 503);
  }
}

import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/lib/database";
import { createCollectionSchema, updateCollectionSchema } from "@/lib/collections";
import { z } from "zod";
export const dynamic = "force-dynamic";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const validOrigin = (r: Request) => !r.headers.get("Origin") || r.headers.get("Origin") === new URL(r.url).origin;
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "sign_in_required" }, 401);
  try {
    const db = database();
    const [groups, members] = await db.batch([
      db.prepare("SELECT id, name FROM collections WHERE owner = ? ORDER BY created_at DESC, id LIMIT 20").bind(user.userId),
      db.prepare("SELECT ci.collection_id, ci.look_id FROM collection_items ci JOIN looks l ON l.owner = ci.owner AND l.id = ci.look_id WHERE ci.owner = ?").bind(user.userId),
    ]);
    return reply({ collections: (groups.results as { id: string; name: string }[]).map((g) => ({ id: g.id, name: g.name, lookIds: (members.results as { collection_id: string; look_id: string }[]).filter((m) => m.collection_id === g.id).map((m) => m.look_id) })) });
  } catch { return reply({ error: "collections_unavailable" }, 503); }
}
async function mutate(request: Request, method: "POST" | "PATCH") {
  if (!validOrigin(request)) return reply({ error: "origin_rejected" }, 403);
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "sign_in_required" }, 401);
  let rawInput: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 1500) return reply({ error: "input_too_large" }, 413);
    rawInput = JSON.parse(raw);
    if (method === "POST") createCollectionSchema.parse(rawInput); else updateCollectionSchema.parse(rawInput);
  } catch { return reply({ error: "invalid_collection" }, 400); }
  try {
    const db = database();
    if (method === "POST") {
      const input = createCollectionSchema.parse(rawInput);
      const existing = await db.prepare("SELECT id FROM collections WHERE owner = ? AND id = ?").bind(user.userId, input.id).first();
      if (existing) return reply({ id: input.id });
      const result = await db.prepare("INSERT OR IGNORE INTO collections (owner, id, name, created_at) SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM collections WHERE owner = ?) < 20").bind(user.userId, input.id, "name" in input ? input.name : "", Date.now(), user.userId).run();
      return result.meta.changes ? reply({ id: input.id }, 201) : reply({ error: "collections_full" }, 409);
    }
    const input = updateCollectionSchema.parse(rawInput);
    const group = await db.prepare("SELECT id FROM collections WHERE owner = ? AND id = ?").bind(user.userId, input.id).first();
    if (!group) return reply({ error: "collection_not_found" }, 404);
    if (input.action === "rename") {
      await db.prepare("UPDATE collections SET name = ? WHERE owner = ? AND id = ?").bind(input.name, user.userId, input.id).run();
    } else if (input.action === "membership") {
      const look = await db.prepare("SELECT id FROM looks WHERE owner = ? AND id = ?").bind(user.userId, input.lookId).first();
      if (!look) return reply({ error: "look_not_found" }, 404);
      if (input.included) await db.prepare("INSERT OR IGNORE INTO collection_items (owner, collection_id, look_id) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM collections WHERE owner = ? AND id = ?) AND EXISTS (SELECT 1 FROM looks WHERE owner = ? AND id = ?)").bind(user.userId, input.id, input.lookId, user.userId, input.id, user.userId, input.lookId).run();
      else await db.prepare("DELETE FROM collection_items WHERE owner = ? AND collection_id = ? AND look_id = ?").bind(user.userId, input.id, input.lookId).run();
    }
    return reply({ id: input.id });
  } catch { return reply({ error: "collections_unavailable" }, 503); }
}
export const POST = (r: Request) => mutate(r, "POST");
export const PATCH = (r: Request) => mutate(r, "PATCH");
export async function DELETE(request: Request) {
  if (!validOrigin(request)) return reply({ error: "origin_rejected" }, 403);
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "sign_in_required" }, 401);
  let id;
  try { id = z.string().uuid().parse(new URL(request.url).searchParams.get("id")); } catch { return reply({ error: "invalid_id" }, 400); }
  try {
    const db = database();
    await db.batch([db.prepare("DELETE FROM collection_items WHERE owner = ? AND collection_id = ?").bind(user.userId, id), db.prepare("DELETE FROM collections WHERE owner = ? AND id = ?").bind(user.userId, id)]);
    return reply({ deleted: id });
  } catch { return reply({ error: "collections_unavailable" }, 503); }
}

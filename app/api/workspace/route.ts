import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/lib/database";
import { emptyWorkspace, workspaceSchema, workspaceUpdateSchema } from "@/lib/workspace";
export const dynamic = "force-dynamic";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  const user = await getChatGPTUser(); if (!user) return reply({ error: "sign_in_required" }, 401);
  try {
    const row = await database().prepare("SELECT payload, revision FROM workspaces WHERE owner = ?").bind(user.userId).first<{ payload: string; revision: number }>();
    return reply(row ? { data: workspaceSchema.parse(JSON.parse(row.payload)), revision: row.revision } : { data: emptyWorkspace, revision: 0 });
  } catch { return reply({ error: "workspace_unavailable" }, 503); }
}
export async function PUT(request: Request) {
  if (request.headers.get("Origin") && request.headers.get("Origin") !== new URL(request.url).origin) return reply({ error: "origin_rejected" }, 403);
  const user = await getChatGPTUser(); if (!user) return reply({ error: "sign_in_required" }, 401);
  let input;
  try { const raw = await request.text(); if (raw.length > 65000) return reply({ error: "input_too_large" }, 413); input = workspaceUpdateSchema.parse(JSON.parse(raw)); }
  catch { return reply({ error: "invalid_workspace" }, 400); }
  try {
    const db = database(), payload = JSON.stringify(input.data);
    const result = input.revision === 0
      ? await db.prepare("INSERT OR IGNORE INTO workspaces (owner, payload, revision) VALUES (?, ?, 1)").bind(user.userId, payload).run()
      : await db.prepare("UPDATE workspaces SET payload = ?, revision = revision + 1 WHERE owner = ? AND revision = ?").bind(payload, user.userId, input.revision).run();
    if (!result.meta.changes) return reply({ error: "revision_conflict" }, 409);
    return reply({ revision: input.revision + 1 });
  } catch { return reply({ error: "workspace_unavailable" }, 503); }
}

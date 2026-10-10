import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
const base = process.env.REMIX_TEST_URL || "http://127.0.0.1:5173";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) throw new Error("Workspace mutation tests are local-only");
const auth = await fetch(`${base}/signin-with-chatgpt?return_to=/`, { redirect: "manual" });
const cookie = auth.headers.getSetCookie().map((v) => v.split(";")[0]).join("; "); assert(cookie);
const headers = { Cookie: cookie, "Content-Type": "application/json" };
const get = async () => (await fetch(`${base}/api/workspace`, { headers })).json();
const original = await get(); assert(original.data);
const put = (body, extra = {}) => fetch(`${base}/api/workspace`, { method: "PUT", headers: { ...headers, ...extra }, body: JSON.stringify(body) });
const foreignOwner = `qa:other:${crypto.randomUUID()}`;
const dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
const files = readdirSync(dir).filter((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite"); assert.equal(files.length, 1);
const db = new DatabaseSync(`${dir}/${files[0]}`); db.exec("PRAGMA busy_timeout=5000");
db.prepare("INSERT INTO workspaces(owner,payload,revision) VALUES (?,?,?)").run(foreignOwner, JSON.stringify({ ...original.data, quiz: { best: 6, attempts: 999 } }), 88);
try {
  assert.equal((await fetch(`${base}/api/workspace`)).status, 401);
  assert.equal((await put({ revision: original.revision, data: original.data }, { Origin: "https://other.example" })).status, 403);
  assert.equal((await put({ revision: 0, data: { ...original.data, owner: foreignOwner } })).status, 400);
  assert.equal((await put({ revision: original.revision, data: { ...original.data, quiz: { best: 7, attempts: 1 } } })).status, 400);
  const item = { id: crypto.randomUUID(), garment: "tu-than", color: "jade", note: "QA test" };
  const data = { ...original.data, wardrobe: { items: [item], accessories: ["fan"], basics: ["skirt", "inner", "sash"] }, quiz: { best: 4, attempts: 1 } };
  const concurrent = await Promise.all([put({ revision: original.revision, data }), put({ revision: original.revision, data: { ...data, quiz: { best: 2, attempts: 2 } } })]);
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 409]);
  const persisted = await get(); assert.equal(persisted.revision, original.revision + 1); assert.equal(persisted.data.wardrobe.items[0].id, item.id);
  assert.equal(db.prepare("SELECT revision FROM workspaces WHERE owner=?").get(foreignOwner).revision, 88);
  assert.equal((await put({ revision: persisted.revision, data: { ...persisted.data, wardrobe: { ...persisted.data.wardrobe, items: [item, item] } } })).status, 400);
  assert.equal((await put({ revision: persisted.revision, data: { ...persisted.data, groups: [{ id: crypto.randomUUID(), name: "QA", event: "ky-yeu", color: "ruby", mode: "same", members: [] }] } })).status, 400);
  console.log("PASS workspace: auth, origin, validation, persistence, ownership, concurrent revision conflict");
} finally {
  const latest = await get(); assert.equal((await put({ revision: latest.revision, data: original.data })).status, 200);
  db.prepare("DELETE FROM workspaces WHERE owner=?").run(foreignOwner); db.close();
}

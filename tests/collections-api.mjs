import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
const base = process.env.REMIX_TEST_URL || "http://127.0.0.1:5173";
const auth = await fetch(`${base}/signin-with-chatgpt?return_to=/`, { redirect: "manual" });
const cookie = auth.headers.getSetCookie().map((v) => v.split(";")[0]).join("; ");
assert(cookie);
const headers = { Cookie: cookie, "Content-Type": "application/json" };
const call = (method, body, extra = {}) => fetch(`${base}/api/collections`, { method, headers: { ...headers, ...extra }, body: JSON.stringify(body) });
const selection = { garment: "ngu-than", color: "jade", harmony: "complementary", event: "van-hoa", style: "gen-z", accessories: ["fan"] };
const result = await (await fetch(`${base}/api/suggestions`, { method: "POST", headers, body: JSON.stringify(selection) })).json();
const look = { ...result.looks[0], id: `qa:${crypto.randomUUID()}` };
const id = crypto.randomUUID(), missing = crypto.randomUUID();
const quotaIds = [];
let fixtureDb;
const foreignOwner = `qa:other:${crypto.randomUUID()}`, foreignGroup = crypto.randomUUID(), foreignLook = `qa:${crypto.randomUUID()}`;
if (["127.0.0.1", "localhost"].includes(new URL(base).hostname)) {
  const directory = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
  const files = readdirSync(directory).filter((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
  assert.equal(files.length, 1);
  fixtureDb = new DatabaseSync(`${directory}/${files[0]}`);
  fixtureDb.exec("PRAGMA busy_timeout = 5000");
  fixtureDb.prepare("INSERT INTO collections(owner,id,name,created_at) VALUES (?,?,?,?)").run(foreignOwner, foreignGroup, "QA foreign", Date.now());
  fixtureDb.prepare("INSERT INTO looks(owner,id,payload,created_at) VALUES (?,?,?,?)").run(foreignOwner, foreignLook, JSON.stringify({ ...look, id: foreignLook }), Date.now());
}
const get = async () => (await (await fetch(`${base}/api/collections`, { headers })).json()).collections;
try {
  assert.equal((await fetch(`${base}/api/collections`)).status, 401);
  assert.equal((await call("POST", { id, name: " " })).status, 400);
  assert.equal((await call("POST", { id, name: "QA", owner: "fake" })).status, 400);
  assert.equal((await call("POST", { id, name: "QA" }, { Origin: "https://other.example" })).status, 403);
  assert.equal((await call("POST", { id, name: "QA · Kỷ yếu" })).status, 201);
  assert.equal((await call("POST", { id, name: "QA · Kỷ yếu" })).status, 200);
  if (fixtureDb) {
    assert(!(await get()).some((g) => g.id === foreignGroup));
    assert.equal((await call("PATCH", { action: "rename", id: foreignGroup, name: "QA hacked" })).status, 404);
    assert.equal((await call("PATCH", { action: "membership", id, lookId: foreignLook, included: true })).status, 404);
    await fetch(`${base}/api/collections?id=${foreignGroup}`, { method: "DELETE", headers });
    assert.equal(fixtureDb.prepare("SELECT name FROM collections WHERE owner=? AND id=?").get(foreignOwner, foreignGroup).name, "QA foreign");
  }
  assert.equal((await call("PATCH", { action: "rename", id: missing, name: "QA" })).status, 404);
  assert.equal((await call("PATCH", { action: "membership", id, lookId: "missing", included: true })).status, 404);
  assert.equal((await fetch(`${base}/api/lookbook`, { method: "POST", headers, body: JSON.stringify(look) })).status, 201);
  for (let i = 0; i < 2; i++) assert.equal((await call("PATCH", { action: "membership", id, lookId: look.id, included: true })).status, 200);
  assert.deepEqual((await get()).find((g) => g.id === id).lookIds, [look.id]);
  assert.equal((await call("PATCH", { action: "rename", id, name: "QA · Tết" })).status, 200);
  assert.equal((await get()).find((g) => g.id === id).name, "QA · Tết");
  await call("PATCH", { action: "membership", id, lookId: look.id, included: false });
  assert.deepEqual((await get()).find((g) => g.id === id).lookIds, []);
  await call("PATCH", { action: "membership", id, lookId: look.id, included: true });
  await fetch(`${base}/api/lookbook?id=${encodeURIComponent(look.id)}`, { method: "DELETE", headers });
  assert.deepEqual((await get()).find((g) => g.id === id).lookIds, []);
  await fetch(`${base}/api/lookbook`, { method: "POST", headers, body: JSON.stringify(look) });
  await call("PATCH", { action: "membership", id, lookId: look.id, included: true });
  assert.equal((await fetch(`${base}/api/collections?id=${id}`, { method: "DELETE", headers })).status, 200);
  assert(!(await get()).some((g) => g.id === id));
  const book = await (await fetch(`${base}/api/lookbook`, { headers })).json();
  assert(book.looks.some((l) => l.id === look.id));
  const currentCount = (await get()).length;
  const attempts = await Promise.all(Array.from({ length: 21 - currentCount }, (_, i) => {
    const newId = crypto.randomUUID(); quotaIds.push(newId);
    return call("POST", { id: newId, name: `QA quota ${i}` });
  }));
  assert.equal((await get()).length, 20);
  assert.equal(attempts.filter((r) => r.status === 409).length, 1);
  console.log("Collection API passed: validation/auth/origin, cross-owner isolation, idempotent writes, rename persistence, deletion cleanup/preservation and concurrent quota boundary.");
} finally {
  await Promise.all(quotaIds.map((qid) => fetch(`${base}/api/collections?id=${qid}`, { method: "DELETE", headers })));
  await fetch(`${base}/api/collections?id=${id}`, { method: "DELETE", headers });
  await fetch(`${base}/api/lookbook?id=${encodeURIComponent(look.id)}`, { method: "DELETE", headers });
  if (fixtureDb) {
    fixtureDb.prepare("DELETE FROM collections WHERE owner=?").run(foreignOwner);
    fixtureDb.prepare("DELETE FROM looks WHERE owner=?").run(foreignOwner);
    fixtureDb.close();
  }
}

import assert from "node:assert/strict";
const base = process.env.REMIX_TEST_URL || "http://127.0.0.1:5173";
const input = {
  garment: "ngu-than",
  event: "van-hoa",
  color: "jade",
  harmony: "complementary",
  style: "truyen-thong",
  accessories: ["khan", "fan"],
};
const jsonHeaders = { "Content-Type": "application/json" };
const post = (body, headers = {}) =>
  fetch(`${base}/api/suggestions`, {
    method: "POST",
    headers: { ...jsonHeaders, ...headers },
    body: JSON.stringify(body),
  });
assert.equal((await fetch(`${base}/api/lookbook`)).status, 401);
assert.equal((await post({})).status, 400);
assert.equal(
  (await post({ ...input, accessories: ["fan", "fan"] })).status,
  400,
);
assert.equal(
  (await post(input, { Origin: "https://other.example" })).status,
  403,
);
const result = await (await post(input)).json();
assert.equal(result.provider, "curated");
assert.equal(result.looks.length, 3);
assert.equal(result.looks[0].garment, input.garment);
assert.equal(result.looks[0].harmony, input.harmony);
const signIn = await fetch(`${base}/signin-with-chatgpt?return_to=/`, {
  redirect: "manual",
});
const cookie = signIn.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .join("; ");
assert(cookie);
const headers = { ...jsonHeaders, Cookie: cookie };
const look = { ...result.looks[0], id: `qa:${crypto.randomUUID()}` };
try {
  const save = await fetch(`${base}/api/lookbook`, {
    method: "POST",
    headers,
    body: JSON.stringify(look),
  });
  assert.equal(save.status, 201);
  const duplicate = await fetch(`${base}/api/lookbook`, {
    method: "POST",
    headers,
    body: JSON.stringify(look),
  });
  assert.equal(duplicate.status, 200);
  const loaded = await (
    await fetch(`${base}/api/lookbook`, { headers })
  ).json();
  assert.equal(loaded.looks.filter((l) => l.id === look.id).length, 1);
  assert.equal(loaded.looks.find((l) => l.id === look.id).harmony, "complementary");
  const csrf = await fetch(`${base}/api/lookbook`, {
    method: "DELETE",
    headers: { ...headers, Origin: "https://other.example" },
  });
  assert.equal(csrf.status, 403);
  const invalid = await fetch(`${base}/api/lookbook`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...look, color: "fake" }),
  });
  assert.equal(invalid.status, 400);
  const signedOut = await fetch(
    `${base}/api/lookbook?id=${encodeURIComponent(look.id)}`,
    { method: "DELETE" },
  );
  assert.equal(signedOut.status, 401);
} finally {
  const deleted = await fetch(
    `${base}/api/lookbook?id=${encodeURIComponent(look.id)}`,
    { method: "DELETE", headers },
  );
  assert.equal(deleted.status, 200);
}
const after = await (await fetch(`${base}/api/lookbook`, { headers })).json();
assert(!after.looks.some((l) => l.id === look.id));
console.log(
  "API checks passed: fallback, input validation, origin checks, authentication, durable save, duplicate save and deletion.",
);

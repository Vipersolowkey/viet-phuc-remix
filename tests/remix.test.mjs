import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import ts from "typescript";
const temp = new URL("../.sites-runtime/test-modules/", import.meta.url);
mkdirSync(temp, { recursive: true });
for (const name of ["remix", "gemini", "ollama", "color-lab", "workspace"]) {
  const source = readFileSync(
    new URL(`../lib/${name}.ts`, import.meta.url),
    "utf8",
  );
  const compiled = ts
    .transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    })
    .outputText.replace('from "./remix"', 'from "./remix.mjs"').replace('from "./gemini"', 'from "./gemini.mjs"');
  writeFileSync(new URL(`${name}.mjs`, temp), compiled);
}
const {
  selectionSchema,
  lookSchema,
  fallbackLooks,
  culturalNotes,
  garments,
  events,
  styles,
  colors,
} = await import(new URL("remix.mjs", temp));
const { geminiLooks } = await import(new URL("gemini.mjs", temp));
const { ollamaLooks, gemmaOutputSchema } = await import(new URL("ollama.mjs", temp));
test("Gemma accepts compact plain text and rejects output that can spoil cards", () => {
  const looks = [0, 1, 2].map(i => ({ title: `Nét riêng ${i}`, reason: "Xanh ngọc nổi bật trên lớp nền ngà." }));
  assert.equal(gemmaOutputSchema.parse({ looks }).looks.length, 3);
  for (const title of [" ", "x".repeat(61), "<script>alert(1)</script>", "**Tên bộ phối**", "https://example.com", "Tên\nBộ phối"]) {
    assert.equal(gemmaOutputSchema.safeParse({ looks: [{ ...looks[0], title }, ...looks.slice(1)] }).success, false);
  }
  assert.equal(gemmaOutputSchema.safeParse({ looks: [{ ...looks[0], reason: "x".repeat(321) }, ...looks.slice(1)] }).success, false);
});
test("Ollama Cloud authenticates only on the server and preserves validated outfit fields", async () => {
  const input = selectionSchema.parse({ garment: "ngu-than", event: "van-hoa", color: "jade", style: "truyen-thong", accessories: ["khan", "fan"] });
  const content = JSON.stringify({ looks: [0, 1, 2].map(i => ({ title: `Phối ${i}`, reason: "Gợi ý phối đương đại." })) });
  const result = await ollamaLooks(input, "test-key", "gemma4:31b", async (url, options) => {
    assert.equal(url, "https://ollama.com/api/chat");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    assert(!options.body.includes("test-key"));
    const payload = JSON.parse(options.body);
    assert.equal(payload.stream, false);
    assert.equal(payload.think, false);
    assert.equal(payload.format, undefined);
    assert.match(payload.messages[0].content, /Không tự kể lịch sử/);
    return Response.json({ done: true, done_reason: "stop", message: { content: `\u0060\u0060\u0060json\n${content}\n\u0060\u0060\u0060` } });
  });
  const base = fallbackLooks(input);
  result.forEach((look, i) => {
    assert.match(look.id, /^ollama:/);
    assert.deepEqual({ ...look, id: base[i].id, title: base[i].title, reason: base[i].reason }, base[i]);
    lookSchema.parse(look);
  });
});
test("Ollama rejects quota errors, truncation, malformed JSON and unauthorized output fields", async () => {
  const input = selectionSchema.parse({ garment: "ngu-than", event: "van-hoa", color: "jade", style: "truyen-thong", accessories: ["khan", "fan"] });
  const valid = { looks: [0, 1, 2].map(i => ({ title: `Phối ${i}`, reason: "Gợi ý." })) };
  for (const response of [
    new Response("quota", { status: 429 }),
    Response.json({ done: false, done_reason: "stop", message: { content: JSON.stringify(valid) } }),
    Response.json({ done: true, done_reason: "length", message: { content: JSON.stringify(valid) } }),
    Response.json({ done: true, done_reason: "stop", message: { content: "not JSON" } }),
    Response.json({ done: true, done_reason: "stop", message: { content: '{"looks":[]}' } }),
    Response.json({ done: true, done_reason: "stop", message: { content: JSON.stringify({ ...valid, garment: "changed" }) } }),
    Response.json({ done: true, done_reason: "stop", message: { content: JSON.stringify({ looks: valid.looks.map(l => ({ ...l, color: "changed" })) }) } }),
    Response.json({ done: true, done_reason: "stop", message: { content: null } }),
  ]) await assert.rejects(() => ollamaLooks(input, "test-key", "gemma4:31b", async () => response));
  await assert.rejects(() => ollamaLooks(input, "test-key", "../invalid", async () => { assert.fail("Invalid model must not reach upstream"); }));
  await assert.rejects(() => ollamaLooks(input, "test-key", "gemma4:31b", async () => { throw new DOMException("Timeout", "TimeoutError"); }));
});
const { hexToHsl, hslToHex, outfitPalette } = await import(new URL("color-lab.mjs", temp));
const { workspaceSchema, emptyWorkspace, wardrobeCoverage, wardrobeSuggestions, newGroup, coordinateGroup, groupLooks, preparationItems, preparationKey } = await import(new URL("workspace.mjs", temp));
test("Wardrobe matches exact garment/color and never claims missing pieces are owned", () => {
  const s = selectionSchema.parse({ garment: "tu-than", event: "ky-yeu", style: "truyen-thong", color: "jade", accessories: ["fan"] });
  const w = { items: [{ id: crypto.randomUUID(), garment: "ao-dai", color: "ruby", note: "" }], accessories: ["fan", "sneaker"], basics: ["shoes"] };
  assert.deepEqual(wardrobeCoverage(s, w).owned, ["Giày dễ di chuyển", "Quạt tay"]);
  assert.equal(wardrobeCoverage(s, w).missing.length, 4);
  const suggestions = wardrobeSuggestions(s, w);
  assert.equal(suggestions[0].garment, "ao-dai"); assert.equal(suggestions[0].color, "ruby");
  assert(!suggestions[0].accessories.includes("sneaker")); assert.equal(suggestions[0].event, s.event);
  assert.deepEqual(wardrobeSuggestions(s, emptyWorkspace.wardrobe), []);
});
test("Group coordination covers ivory, six people and produces valid saveable looks", () => {
  const s = selectionSchema.parse({ garment: "ao-dai", event: "ky-yeu", style: "gen-z", color: "ivory", accessories: [] });
  const plan = newGroup(s); plan.members = Array.from({ length: 6 }, (_, i) => ({ ...plan.members[0], id: crypto.randomUUID(), name: `Bạn ${i}` }));
  const coordinated = coordinateGroup(plan);
  assert.deepEqual(coordinated.members.map((m) => m.color), ["ivory", "jade", "ivory", "jade", "ivory", "jade"]);
  assert.equal(groupLooks(coordinated).length, 6); groupLooks(coordinated).forEach((l) => assert(lookSchema.safeParse(l).success));
  assert.equal(new Set(groupLooks(coordinated).map((l) => l.id)).size, 6);
  assert.equal(workspaceSchema.safeParse({ ...emptyWorkspace, groups: [coordinated] }).success, true);
  assert.equal(workspaceSchema.safeParse({ ...emptyWorkspace, groups: [{ ...coordinated, members: [...coordinated.members, coordinated.members[0]] }] }).success, false);
});
test("Checklist progress keys follow selection and context, independent of accessory order", () => {
  const s = selectionSchema.parse({ garment: "ao-dai", event: "ky-yeu", style: "gen-z", color: "ruby", accessories: ["fan", "bag"] });
  const p = { environment: "outside", weather: "rain", walking: true };
  const items = preparationItems(s, p);
  assert(items.some((i) => i.id === "photo")); assert(items.some((i) => i.id === "rain")); assert(!items.some((i) => i.id === "heat"));
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  assert.equal(preparationKey(s, p), preparationKey({ ...s, accessories: ["bag", "fan"] }, p));
  assert.notEqual(preparationKey(s, p), preparationKey({ ...s, event: "dam-cuoi" }, p));
  assert.notEqual(preparationKey(s, p), preparationKey(s, { ...p, weather: "hot" }));
});
const input = {
  garment: "ao-dai",
  event: "hoi-xuan",
  style: "thanh-lich",
  color: "ruby",
  accessories: ["bag"],
};
test("Color Lab preserves primary and garment base while deriving distinct harmony accents", () => {
  assert.deepEqual(hexToHsl("#ff0000"), [0, 100, 50]);
  assert.equal(hslToHex(120, 100, 50), "#00ff00");
  assert.equal(hslToHex(-120, 100, 50), "#0000ff");
  assert.throws(() => hexToHsl("invalid"));
  for (const color of colors) {
    assert.equal(hslToHex(...hexToHsl(color.hex)), color.hex);
    for (const garment of garments) {
      const accents = new Set();
      for (const harmony of ["neutral", "analogous", "complementary"]) {
        const palette = outfitPalette(color.id, garment.id, harmony);
        assert.equal(palette[0].hex, color.hex);
        assert.equal(palette[1].hex, garment.id === "tu-than" ? "#242d37" : "#ece6d8");
        assert.equal(palette.reduce((sum, c) => sum + c.share, 0), 100);
        assert(palette.every((c) => /^#[0-9a-f]{6}$/.test(c.hex)));
        accents.add(palette[2].hex);
        const looks = fallbackLooks({ ...input, color: color.id, garment: garment.id, harmony });
        assert(looks.every((look) => look.harmony === harmony));
      }
      assert.equal(accents.size, 3);
    }
  }
});
test("legacy lookbook payloads default to neutral without changing identity", () => {
  const oldLook = fallbackLooks(input)[0];
  assert.equal(lookSchema.parse(oldLook).harmony, "neutral");
  assert.equal(fallbackLooks({ ...input, harmony: "neutral" })[0].id, oldLook.id);
  assert.notEqual(fallbackLooks({ ...input, harmony: "analogous" })[0].id, oldLook.id);
  assert.equal(selectionSchema.safeParse({ ...input, harmony: "fake" }).success, false);
});
test("all 270 garment/event/style/color combinations produce valid distinct alternatives", () => {
  const ids = new Set();
  let count = 0;
  for (const g of garments)
    for (const e of events)
      for (const s of styles)
        for (const c of colors) {
          const selection = {
            ...input,
            garment: g.id,
            event: e.id,
            style: s.id,
            color: c.id,
          };
          const looks = lookSchema
            .array()
            .length(3)
            .parse(fallbackLooks(selection));
          assert.equal(new Set(looks.map((l) => l.color)).size, 3);
          assert.equal(looks[0].color, c.id);
          for (const look of looks) {
            assert.equal(look.garment, g.id);
            assert.equal(look.event, e.id);
            assert.equal(look.style, s.id);
            assert.deepEqual(look.accessories, input.accessories);
            assert(!ids.has(look.id));
            ids.add(look.id);
          }
          count++;
        }
  assert.equal(count, 270);
});
test("invalid selections, duplicate accessories and excess accessories are rejected", () => {
  for (const selection of [
    { ...input, garment: "fake" },
    { ...input, accessories: ["bag", "bag"] },
    { ...input, accessories: ["bag", "fan", "non", "khan"] },
    { ...input, extra: "injection" },
  ])
    assert.equal(selectionSchema.safeParse(selection).success, false);
});
test("cultural notes flag concrete contexts without claiming historical authenticity", () => {
  const notes = culturalNotes({
    ...input,
    garment: "tu-than",
    event: "di-tich",
    accessories: ["non", "sneaker"],
  }).join(" ");
  assert.match(notes, /đương đại|hiện đại/);
  assert.match(notes, /quai thao/);
  assert.match(notes, /di tích/);
  assert.match(
    culturalNotes({ ...input, event: "dam-cuoi" }).join(" "),
    /chủ tiệc/,
  );
});
test("Gemini request keeps API key in server header and preserves approved outfit structure", async () => {
  const fakeFetch = async (url, options) => {
    assert.match(url, /generativelanguage.googleapis.com/);
    assert.equal(options.headers["x-goog-api-key"], "test-key");
    assert(!options.body.includes("test-key"));
    const payload = JSON.parse(options.body);
    assert.equal(payload.generationConfig.responseMimeType, "application/json");
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              {
                text: JSON.stringify({
                  looks: [0, 1, 2].map((i) => ({
                    title: `Phối ${i}`,
                    reason: "Gợi ý thẩm mỹ hiện đại.",
                  })),
                }),
              },
            ],
          },
        },
      ],
    });
  };
  const result = await geminiLooks(
    input,
    "test-key",
    "gemini-2.5-flash",
    fakeFetch,
  );
  const base = fallbackLooks(input);
  for (let i = 0; i < 3; i++) {
    assert.equal(result[i].color, base[i].color);
    assert.equal(result[i].garment, input.garment);
    assert.deepEqual(result[i].accessories, input.accessories);
  }
  assert.equal(result.length, 3);
});
test("Gemini blocks truncated, malformed and upstream error responses", async () => {
  const responses = [
    new Response("error", { status: 429 }),
    Response.json({
      candidates: [
        { finishReason: "MAX_TOKENS", content: { parts: [{ text: "{}" }] } },
      ],
    }),
    Response.json({
      candidates: [
        { finishReason: "STOP", content: { parts: [{ text: "not json" }] } },
      ],
    }),
    Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: '{"looks":[]}' }] },
        },
      ],
    }),
  ];
  for (const response of responses)
    await assert.rejects(() =>
      geminiLooks(input, "test-key", "gemini-2.5-flash", async () => response),
    );
});

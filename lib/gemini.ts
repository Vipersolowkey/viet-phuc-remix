import { z } from "zod";
import {
  colors,
  garments,
  events,
  styles,
  accessories,
  fallbackLooks,
  type Selection,
  type Look,
} from "./remix";
export const modelOutputSchema = z
  .object({
    looks: z
      .array(
        z
          .object({
            title: z.string().min(1).max(80),
            reason: z.string().min(1).max(600),
          })
          .strict(),
      )
      .length(3),
  })
  .strict();
export function buildPrompt(selection: Selection) {
  const g = garments.find((g) => g.id === selection.garment)!;
  const candidates = fallbackLooks(selection);
  return {
    system:
      "Bạn là trợ lý phối Việt phục cho học sinh, sinh viên. Viết tiếng Việt tự nhiên. Chỉ viết tên và lý do thẩm mỹ cho đúng 3 phương án có sẵn, theo cùng thứ tự. Không thay đổi trang phục, màu, phụ kiện, sự kiện hay phong cách. Không tự kể lịch sử, nguồn gốc, ý nghĩa biểu tượng hoặc quy tắc văn hóa; không bịa nguồn. Không nói đây là phục dựng nguyên bản. Với sneaker, ghi đây là cách phối đương đại. Không cho điểm độ chính xác văn hóa.",
    input: JSON.stringify({
      selection: {
        garment: g.name,
        event: events.find((x) => x.id === selection.event)!.name,
        style: styles.find((x) => x.id === selection.style)!.name,
        accessories: selection.accessories.map(
          (a) => accessories.find((x) => x.id === a)!.name,
        ),
      },
      culturalContext: {
        fact: g.fact,
        signature: g.signature,
        advice: g.advice,
        source: g.source,
      },
      candidates: candidates.map((l) => ({
        color: colors.find((c) => c.id === l.color)!.name,
        base: l.reason,
        ...(g.id === "tu-than" ? { sash: "Thắt lưng dùng màu điểm nhấn; chỉ váy là màu tối. Không mô tả thắt lưng là màu tối cố định." } : {}),
      })),
    }),
  };
}
export async function geminiLooks(
  selection: Selection,
  key: string,
  model: string,
  fetcher: typeof fetch = fetch,
): Promise<Look[]> {
  if (!/^[a-zA-Z0-9.-]+$/.test(model)) throw new Error("invalid_model");
  const prompt = buildPrompt(selection);
  const responseSchema = {
    type: "OBJECT",
    properties: {
      looks: {
        type: "ARRAY",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "OBJECT",
          properties: { title: { type: "STRING" }, reason: { type: "STRING" } },
          required: ["title", "reason"],
        },
      },
    },
    required: ["looks"],
  };
  const response = await fetcher(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.input }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    },
  );
  if (!response.ok) throw new Error("upstream_error");
  const body = (await response.json()) as {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
  };
  const candidate = body.candidates?.[0];
  if (candidate?.finishReason !== "STOP") throw new Error("incomplete_output");
  const raw = candidate.content?.parts?.map((p) => p.text || "").join("");
  if (!raw) throw new Error("empty_output");
  const result = modelOutputSchema.parse(JSON.parse(raw));
  return fallbackLooks(selection).map((look, i) => ({
    ...look,
    id: `gemini:${crypto.randomUUID()}`,
    title: result.looks[i].title,
    reason: result.looks[i].reason,
  }));
}

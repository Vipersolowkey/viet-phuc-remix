import { buildPrompt, modelOutputSchema } from "./gemini";
import { z } from "zod";
import { fallbackLooks, type Selection, type Look } from "./remix";

export const DEFAULT_OLLAMA_MODEL = "gemma4:31b";
const plainText = z.string().trim().min(1).refine(
  (text) => !/[<>\u0000-\u001f\u007f]|https?:\/\/|\*\*|```|\[[^\]]*\]\(/.test(text),
  "Expected plain text",
);
export const gemmaOutputSchema = z.object({
  looks: z.array(z.object({
    title: plainText.refine((text) => text.length <= 60, "Title too long"),
    reason: plainText.refine((text) => text.length <= 320, "Reason too long"),
  }).strict()).length(3),
}).strict();

export async function ollamaLooks(
  selection: Selection,
  key: string,
  model: string = DEFAULT_OLLAMA_MODEL,
  fetcher: typeof fetch = fetch,
): Promise<Look[]> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(model))
    throw new Error("invalid_model");
  const prompt = buildPrompt(selection);
  const response = await fetcher("https://ollama.com/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    signal: AbortSignal.timeout(14000),
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      // Cloud does not enforce JSON schemas; validate the result below.
      messages: [
        {
          role: "system",
          content: `${prompt.system} Chỉ trả về một JSON object, không markdown, HTML, URL hay xuống dòng trong nội dung, không thêm trường: {"looks":[{"title":"Tên bộ phối","reason":"Lý do phối"},{"title":"Tên bộ phối","reason":"Lý do phối"},{"title":"Tên bộ phối","reason":"Lý do phối"}]}. Viết tên ngắn 3–7 từ, tối đa 60 ký tự, không liệt kê toàn bộ trang phục và phụ kiện trong tên. Mỗi reason gồm 1–2 câu ngắn, tối đa 320 ký tự: nêu cách màu chủ đạo kết hợp với lớp nền và điểm nhấn của phương án. Chỉ nhắc phụ kiện thực sự có trong lựa chọn. Không thêm món đồ, lời miễn trừ hay lời giới thiệu AI. Dùng giọng trung tính, tránh gán giới tính cho người mặc hoặc dùng cụm 'nữ tính', 'nam tính'. Khi có sneaker, chỉ cần gọi cách phối là đương đại.`,
        },
        { role: "user", content: prompt.input },
      ],
      options: { temperature: 0.3, num_predict: 1800 },
    }),
  });
  if (!response.ok) throw new Error("upstream_error");
  const body = (await response.json()) as {
    done?: boolean;
    done_reason?: string;
    message?: { content?: unknown };
  };
  if (body.done !== true || body.done_reason !== "stop")
    throw new Error("incomplete_output");
  if (typeof body.message?.content !== "string")
    throw new Error("empty_output");
  const raw = body.message.content.trim();
  // Accept a single fenced JSON block, but reject surrounding prose.
  const json = raw.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, "$1");
  const result = gemmaOutputSchema.parse(modelOutputSchema.parse(JSON.parse(json)));
  return fallbackLooks(selection).map((look, i) => ({
    ...look,
    id: `ollama:${crypto.randomUUID()}`,
    title: result.looks[i].title,
    reason: result.looks[i].reason,
  }));
}

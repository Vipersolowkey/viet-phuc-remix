import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { selectionSchema, fallbackLooks } from "@/lib/remix";
import { geminiLooks } from "@/lib/gemini";
import { ollamaLooks, DEFAULT_OLLAMA_MODEL } from "@/lib/ollama";
export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; reset: number }>();
const reply = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: "origin_rejected" }, 403);
  let selection;
  try {
    const text = await request.text();
    if (text.length > 3000) return reply({ error: "input_too_large" }, 413);
    selection = selectionSchema.parse(JSON.parse(text));
  } catch {
    return reply({ error: "invalid_selection" }, 400);
  }
  const fallback = (notice: string) =>
    reply({ provider: "curated", looks: fallbackLooks(selection), notice });
  const provider = env.AI_PROVIDER || (env.OLLAMA_API_KEY ? "ollama" : "gemini");
  const key = provider === "ollama" ? env.OLLAMA_API_KEY : provider === "gemini" ? env.GEMINI_API_KEY : undefined;
  const label = provider === "ollama" ? "Gemma" : "Gemini";
  if (!key)
    return fallback(
      "Gợi ý có sẵn cho bộ phối của bạn.",
    );
  const user = await getChatGPTUser();
  if (!user)
    return fallback(
      `Đăng nhập để dùng ${label}. Bạn vẫn có thể dùng gợi ý có sẵn.`,
    );
  const now = Date.now();
  for (const [id, b] of attempts) if (b.reset < now) attempts.delete(id);
  let bucket = attempts.get(user.userId);
  if (!bucket) {
    bucket = { count: 0, reset: now + 3600000 };
    attempts.set(user.userId, bucket);
  }
  if (bucket.count >= 20)
    return fallback(
      "Đã hết lượt gợi ý AI. Bạn vẫn có thể dùng các bộ phối có sẵn.",
    );
  bucket.count++;
  try {
    return reply({
      provider,
      looks: provider === "ollama"
        ? await ollamaLooks(selection, key, env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL)
        : await geminiLooks(selection, key, env.GEMINI_MODEL || "gemini-2.5-flash"),
      model: provider === "ollama" ? env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL : env.GEMINI_MODEL || "gemini-2.5-flash",
    });
  } catch {
    return fallback(
      "Chưa tạo được gợi ý mới. Đã chọn các bộ phối có sẵn cho bạn.",
    );
  }
}

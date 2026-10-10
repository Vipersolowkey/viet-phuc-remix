export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_PREPARED_BYTES = 4 * 1024 * 1024;
export const MAX_REQUEST_BYTES = 9 * 1024 * 1024;
export const imageTypes = ["image/jpeg", "image/png", "image/webp"];

export function uploadError(file: { size: number; type: string }) {
  if (!imageTypes.includes(file.type)) return "Chọn ảnh JPG, PNG hoặc WebP.";
  if (!file.size || file.size > MAX_UPLOAD_BYTES) return "Chọn ảnh có dung lượng tối đa 10 MB.";
  return "";
}

export function imageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/png") return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4))==="RIFF" && String.fromCharCode(...bytes.slice(8,12))==="WEBP";
  return false;
}

export async function boundedBody(request: Request, max = MAX_REQUEST_BYTES) {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > max) throw new Error("input_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_image");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel(); throw new Error("input_too_large"); }
    chunks.push(value);
  }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return body;
}

export function tryonEndpoint(value?: string, allowLocal = false) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.protocol !== "https:" && !(allowLocal && url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) return null;
    return url.href.replace(/\/$/, "");
  } catch { return null; }
}

export const tryonErrors: Record<string, string> = {
  not_configured: "Thử đồ AI chưa được mở trên phiên bản này. Bạn vẫn có thể chuẩn bị ảnh và vùng áo.",
  model_unavailable: "Máy thử đồ đang khởi động hoặc tạm nghỉ. Hãy thử lại sau.",
  busy: "Máy thử đồ đang xử lý một ảnh khác. Hãy thử lại sau ít phút.",
  rate_limited: "Bạn đã dùng hết lượt thử đồ trong giờ này. Hãy thử lại sau.",
  invalid_image: "Chưa đọc được ảnh hoặc vùng áo. Hãy chọn lại ảnh và tô vùng cần thay.",
  input_too_large: "Ảnh quá lớn để xử lý. Hãy chọn ảnh nhỏ hơn.",
  timeout: "Ảnh chưa xử lý xong trong thời gian chờ. Hãy thử lại sau ít phút.",
  inference_failed: "Chưa tạo được ảnh thử đồ. Hãy thử ảnh đứng thẳng, thấy rõ trang phục.",
  output_rejected: "Model chưa trả được ảnh phù hợp cho bộ này. Hãy đổi ảnh hoặc trang phục rồi thử lại.",
};

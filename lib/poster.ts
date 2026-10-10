import { accessories, events, garments, styles, type Look } from "./remix";
import { harmonies, outfitPalette } from "./color-lab";

export type PosterLayout = "feed" | "story";
export const posterSizes = { feed: { width: 1080, height: 1350 }, story: { width: 1080, height: 1920 } };

function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/u)) {
    if (ctx.measureText(word).width > width) {
      if (line) { result.push(line); line = ""; }
      for (const char of Array.from(word)) {
        if (ctx.measureText(line + char).width > width && line) { result.push(line); line = ""; }
        line += char;
      }
      continue;
    }
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { result.push(line); line = word; }
    else line = next;
  }
  if (line) result.push(line);
  return result;
}
function textBox(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, fontSize: number, color = "#412c36", display = false) {
  let size = fontSize;
  let wrapped: string[];
  do {
    ctx.font = `${display ? "600" : "400"} ${size}px ${display ? '"Bricolage Grotesque", sans-serif' : '"Be Vietnam Pro", sans-serif'}`;
    wrapped = lines(ctx, text, width);
    if (wrapped.length * size * 1.3 <= height) break;
    size -= 1;
  } while (size > 12);
  ctx.fillStyle = color;
  wrapped.forEach((line, i) => ctx.fillText(line, x, y + i * size * 1.3));
}

let fontsReady: Promise<void> | undefined;
export function loadPosterFonts() {
  return fontsReady ??= Promise.all([
    document.fonts.load('600 70px "Bricolage Grotesque"', 'Việt phục Remix Sắc đỏ Áo dài ấ ễ ộ ự ỳ'),
    document.fonts.load('400 28px "Be Vietnam Pro"', 'Việt phục Remix Sắc đỏ Áo dài ấ ễ ộ ự ỳ'),
  ]).then((loaded) => {
    if (loaded.some((faces) => faces.length === 0)) throw new Error("Poster fonts unavailable");
  }).catch((error) => { fontsReady = undefined; throw error; });
}

export function drawPoster(canvas: HTMLCanvasElement, look: Look, title: string, layout: PosterLayout) {
  const size = posterSizes[layout];
  canvas.width = size.width; canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const g = garments.find((g) => g.id === look.garment)!;
  const palette = outfitPalette(look.color, look.garment, look.harmony);
  const story = layout === "story";
  const width = 936, left = 72;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fbf9f6"; ctx.fillRect(0, 0, size.width, size.height);
  ctx.fillStyle = palette[0].hex; ctx.fillRect(0, 0, size.width, 14);
  textBox(ctx, "việt phục remix.", left, 65, width, 50, 34, "#76283c", true);
  textBox(ctx, `${g.name.toLocaleUpperCase("vi")} · LOOKBOOK CỦA TÔI`, left, 135, width, 45, 24, "#886d79");
  textBox(ctx, title.trim() || look.title, left, story ? 220 : 195, width, story ? 280 : 180, story ? 84 : 70, "#412c36", true);
  const boardY = story ? 565 : 395, boardH = story ? 410 : 260;
  ctx.fillStyle = "#f0e8e8"; ctx.fillRect(left - 12, boardY - 12, width + 24, boardH + 24);
  let x = left;
  for (const c of palette) {
    const w = (width - 16) * c.share / 100;
    ctx.fillStyle = c.hex; ctx.fillRect(x, boardY, w, boardH);
    x += w + 8;
  }
  const legendY = boardY + boardH + 45;
  palette.forEach((c, i) => {
    const y = legendY + i * 46;
    ctx.fillStyle = c.hex; ctx.fillRect(left, y + 3, 24, 24);
    textBox(ctx, `${c.role} · ${c.name}`, left + 42, y, 610, 38, 27);
    textBox(ctx, c.hex.toUpperCase(), 815, y + 2, 193, 36, 25, "#886d79");
  });
  const metaY = story ? 1200 : 860;
  const mode = harmonies.find((m) => m.id === (look.harmony ?? "neutral"))!;
  textBox(ctx, `${events.find((e) => e.id === look.event)!.name} · ${styles.find((s) => s.id === look.style)!.name}`, left, metaY, width, 85, 33);
  textBox(ctx, `Phụ kiện: ${look.accessories.map((id) => accessories.find((a) => a.id === id)!.name).join(" · ") || "Không phụ kiện"}`, left, metaY + 82, width, 76, 28);
  textBox(ctx, `Bảng màu ${mode.name.toLocaleLowerCase("vi")} · Tỷ lệ tham khảo 60 / 30 / 10`, left, metaY + 155, width, 60, 24, "#886d79");
  const factY = story ? 1500 : 1100;
  ctx.fillStyle = "#e5d9de"; ctx.fillRect(left, factY - 25, width, 1);
  textBox(ctx, "NÉT VIỆT CẦN GIỮ", left, factY, width, 35, 22, "#76283c");
  textBox(ctx, g.signature, left, factY + 48, width, 100, 28);
  textBox(ctx, `Nguồn: ${g.source.name} · ${new URL(g.source.url).hostname}`, left, factY + 146, width, 52, 21, "#886d79");
  textBox(ctx, "Bảng phối gợi ý đương đại · Không phải phục dựng lịch sử", left, size.height - 60, width, 32, 20, "#886d79");
}

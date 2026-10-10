import { garments, events, accessories, type Look } from "./remix";
import { outfitPalette } from "./color-lab";
import { loadMockup, renderMockup } from "./mockup";
import { loadPosterFonts } from "./poster";
function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, width: number, size: number, display = false) {
  ctx.font = `${display ? 600 : 400} ${size}px "${display ? "Bricolage Grotesque" : "Be Vietnam Pro"}"`;
  let v = value; while (ctx.measureText(v).width > width && v.length > 1) v = v.slice(0, -1);
  if (v !== value) v = v.slice(0, -1).trim() + "…";
  ctx.fillText(v, x, y);
}
export async function drawCollage(canvas: HTMLCanvasElement, name: string, looks: Look[], valid = () => true, mode: "collection" | "group" = "collection") {
  if (!looks.length || looks.length > 6) throw new Error("Choose one to six looks");
  const images = await Promise.all(looks.map((l) => loadMockup(l.garment))); await loadPosterFonts();
  if (!valid()) return;
  canvas.width = 1080; canvas.height = 290 + Math.ceil(looks.length / 2) * 720;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#fbf9f6"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.textBaseline = "top";
  ctx.fillStyle = "#76283c"; text(ctx, "việt phục remix.", 50, 40, 980, 28, true);
  ctx.fillStyle = "#412c36"; text(ctx, name.trim() || "Lookbook Việt phục", 50, 92, 980, 56, true);
  ctx.fillStyle = "#886d79"; text(ctx, `${looks.length} ${mode === "group" ? "thành viên · Kế hoạch phối nhóm" : "bộ phối · Bộ sưu tập của tôi"}`, 50, 166, 980, 23);
  looks.forEach((look, i) => {
    const x = looks.length % 2 && i === looks.length - 1 ? 300 : 50 + i % 2 * 500, y = 230 + Math.floor(i / 2) * 720, w = 480;
    const g = garments.find((g) => g.id === look.garment)!;
    const palette = outfitPalette(look.color, look.garment, look.harmony);
    ctx.fillStyle = "#f1e9ed"; ctx.fillRect(x, y, w, 445);
    ctx.drawImage(renderMockup(images[i], look), x + 108, y + 10, 264, 396);
    let offset = x; palette.forEach((p) => { const width = w * p.share / 100; ctx.fillStyle = p.hex; ctx.fillRect(offset, y + 422, width, 23); offset += width; });
    ctx.fillStyle = "#412c36"; text(ctx, look.title, x, y + 463, w, 29, true);
    ctx.fillStyle = "#76283c"; text(ctx, `${g.name} · ${events.find((e) => e.id === look.event)!.name}`, x, y + 512, w, 21);
    ctx.fillStyle = "#886d79"; text(ctx, look.accessories.map((id) => accessories.find((a) => a.id === id)!.name).join(" · ") || "Không phụ kiện", x, y + 552, w, 20);
    // Every card carries its cultural source, so exported images retain provenance.
    text(ctx, `Nguồn: ${g.source.name}`, x, y + 593, w, 18);
    text(ctx, new URL(g.source.url).hostname, x, y + 625, w, 18);
  });
  ctx.fillStyle = "#886d79"; text(ctx, "Minh họa phối đồ đương đại · Không phải phục dựng lịch sử", 50, canvas.height - 44, 980, 19);
}

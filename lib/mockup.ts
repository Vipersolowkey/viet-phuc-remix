import { colors, type Selection } from "./remix";
import { outfitPalette } from "./color-lab";
export const mockupAssets = { "ao-dai": "/mockups/ao-dai.png", "ngu-than": "/mockups/ao-ngu-than.png", "tu-than": "/mockups/ao-tu-than.png" };
const images = new Map<string, Promise<HTMLImageElement>>();
export function loadMockup(garment: Selection["garment"]) {
  const src = mockupAssets[garment];
  if (!images.has(src)) images.set(src, new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = () => { images.delete(src); reject(new Error("Mockup unavailable")); }; img.src = src;
  }));
  return images.get(src)!;
}
function rgb(hex: string) { return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); }
// A live fabric tint: preserve original texture, never alter the source asset.
export function renderMockup(image: HTMLImageElement, selection: Selection) {
  const canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 576;
  const ctx = canvas.getContext("2d", { willReadFrequently: true }); if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const main = rgb(colors.find((c) => c.id === selection.color)!.hex);
  const accent = rgb(outfitPalette(selection.color, selection.garment, selection.harmony)[2].hex);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const p = pixels.data, x = (i / 4 % canvas.width) / canvas.width, y = Math.floor(i / 4 / canvas.width) / canvas.height;
    // Remove the generated backdrop glow while retaining opaque fabric and edge antialiasing.
    if (p[i + 3] < 225) { p[i + 3] = 0; continue; }
    const whiteFabric = p[i + 2] > p[i] * .85 && Math.max(p[i], p[i+1], p[i+2]) - Math.min(p[i], p[i+1], p[i+2]) < 50;
    const hem = selection.garment === "ngu-than" ? .76 - Math.max(0, Math.abs(x - .5) - .07) * .13 : .805 - Math.max(0, Math.abs(x - .5) - .06) * .2;
    let coat = y < hem;
    if (selection.garment === "ao-dai" && y > .52 && Math.abs(x - .5) < (y - .52) * .055) coat = false;
    if (selection.garment === "tu-than") {
      const leftEdge = y < .22 ? .44 : y < .45 ? .44 - (y - .22) * .09 : .419 - (y - .45) * .33;
      coat = y < .84 && (x < leftEdge || x > 1 - leftEdge) && (p[i] + p[i+1] + p[i+2]) / 3 > 166;
    }
    const sash = selection.garment === "tu-than" && x > .38 && x < .6 && y > .21 && y < .73 && p[i] > p[i + 2] * 1.35 && p[i + 1] > p[i + 2] * 1.2;
    const tint = sash ? accent : coat && whiteFabric ? main : null;
    if (tint) {
      const light = (p[i] + p[i+1] + p[i+2]) / (3 * 255);
      for (let c = 0; c < 3; c++) p[i+c] = Math.round(tint[c] * light);
    }
  }
  ctx.putImageData(pixels, 0, 0); return canvas;
}

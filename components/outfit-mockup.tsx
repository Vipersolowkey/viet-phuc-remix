"use client";
import { useEffect, useRef, useState } from "react";
import { Gem, ShoppingBag, Fan, CircleDot, Triangle, Footprints } from "lucide-react";
import { loadMockup, renderMockup } from "@/lib/mockup";
import { accessories, colors, garments, type Selection } from "@/lib/remix";
import { outfitPalette } from "@/lib/color-lab";
const icons = { pearl: Gem, bag: ShoppingBag, fan: Fan, khan: CircleDot, non: Triangle, sneaker: Footprints };
export function OutfitMockup({ selection, compact = false }: { selection: Selection; compact?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const g = garments.find((g) => g.id === selection.garment)!;
  const color = colors.find((c) => c.id === selection.color)!;
  const palette = outfitPalette(selection.color, selection.garment, selection.harmony);
  useEffect(() => {
    let canceled = false; setReady(false);
    loadMockup(selection.garment).then((image) => {
      if (canceled || !ref.current) return;
      const result = renderMockup(image, selection);
      ref.current.width = result.width; ref.current.height = result.height;
      const ctx = ref.current.getContext("2d"); if (!ctx) throw new Error();
      ctx.drawImage(result, 0, 0); setError(false); setReady(true);
    }).catch(() => { if (!canceled) setError(true); });
    return () => { canceled = true; };
  }, [selection.garment, selection.color, selection.harmony]);
  return <div className={`outfit-mockup ${compact ? "compact" : ""}`} style={{ background: color.tint }}>
    {!compact && <div className="mockup-top"><span className="eyebrow">BỘ PHỐI ĐANG THỬ</span><span className="outline-pill">{g.name}</span></div>}
    <div className="mockup-stage"><canvas ref={ref} role="img" style={{ visibility: ready ? "visible" : "hidden" }} aria-label={`Minh họa ${g.name} màu ${color.name}`} />{!ready && <p className="mockup-status" role="status">{error ? "Chưa tải được minh họa. Bảng màu vẫn dùng được." : "Đang tải minh họa…"}</p>}
      {!compact && <div className="mockup-accessories" aria-label="Phụ kiện đi cùng" style={{ color: palette[2].hex }}>{selection.accessories.map((id) => { const Icon = icons[id]; return <span key={id}><Icon size={25} /><small>{accessories.find((a) => a.id === id)!.name}</small></span>; })}{!selection.accessories.length && <span className="no-accessory">Không phụ kiện</span>}</div>}
    </div>
    {!compact && <div className="mockup-bottom"><strong>{color.name}</strong><div className="image-palette">{palette.map((p) => <i key={p.role} style={{ background: p.hex }} />)}</div><p>Minh họa màu sắc · Phụ kiện tham khảo</p></div>}
  </div>;
}

"use client";
import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { colors, garments, type Selection } from "@/lib/remix";
import { harmonies, hexToHsl, outfitPalette, type Harmony } from "@/lib/color-lab";

export function ColorLab({ selection, onApply }: { selection: Selection; onApply: (patch: Partial<Selection>) => void }) {
  const [colorId, setColorId] = useState(selection.color);
  const [harmony, setHarmony] = useState<Harmony>(selection.harmony ?? "neutral");
  const palette = outfitPalette(colorId, selection.garment, harmony);
  const mode = harmonies.find((m) => m.id === harmony)!;
  const selectedColor = colors.find((c) => c.id === colorId)!;
  const hue = hexToHsl(selectedColor.hex)[0];
  return <>
    <div className="page-intro"><div><span className="eyebrow">THỬ MÀU, TÌM CHẤT RIÊNG</span><h1>Color Lab.</h1><p>Thử ba cách phối màu cho {garments.find((g) => g.id === selection.garment)!.name.toLocaleLowerCase("vi")} của bạn.</p></div><Palette size={34} /></div>
    <div className="color-lab-grid">
      <section className="lab-controls" aria-label="Điều chỉnh bảng màu">
        <h2>Chọn sắc chủ đạo</h2>
        <RadioGroup value={colorId} onValueChange={(v) => setColorId(v as Selection["color"])} className="lab-colors" aria-label="Màu chủ đạo trong Color Lab">
          {colors.map((c) => <label key={c.id} className={colorId === c.id ? "active" : ""}><RadioGroupItem value={c.id} className="sr-only" aria-label={c.name} /><span style={{ background: c.hex }}>{colorId === c.id && <Check size={17} color={c.id === "ivory" ? "#612735" : "white"} />}</span>{c.name}</label>)}
        </RadioGroup>
        <h2>Cách kết hợp</h2>
        <RadioGroup value={harmony} onValueChange={(v) => setHarmony(v as Harmony)} className="harmony-options" aria-label="Cách phối màu">
          {harmonies.map((m, i) => <label key={m.id} className={harmony === m.id ? "active" : ""}><RadioGroupItem value={m.id} className="sr-only" aria-label={m.name} /><span>0{i + 1}</span><strong>{m.name}</strong>{harmony === m.id && <Check size={17} />}</label>)}
        </RadioGroup>
        <button className="primary-button" onClick={() => onApply({ color: colorId, harmony })}>Áp dụng vào bộ phối</button>
      </section>
      <section className="lab-preview" aria-label="Kết quả thử màu" aria-live="polite">
        <div className="lab-preview-heading"><span className="eyebrow">{mode.name.toLocaleUpperCase("vi")}</span><span>{selectedColor.name}</span></div>
        <div className="color-wheel" aria-hidden="true"><i style={{ rotate: `${hue}deg` }} /><div><span>TỶ LỆ GỢI Ý</span><strong>60 / 30 / 10</strong></div></div>
        <div className="lab-palette">{palette.map((c) => <div key={c.role} style={{ flex: c.share, background: c.hex }} title={`${c.name}: ${c.hex}`} />)}</div>
        <div className="lab-color-legend">{palette.map((c) => <div key={c.role}><span>{c.share}% · {c.role}</span><strong>{c.name}</strong><code>{c.hex.toUpperCase()}</code></div>)}</div>
        <h2>Vì sao phối như vậy?</h2><p>{mode.description}</p>
        {colorId === "ivory" && harmony !== "neutral" && <p className="lab-tip">Trắng ngà có độ bão hòa thấp: điểm nhấn được tăng độ đậm để dễ phân biệt với lớp nền.</p>}
        <p className="lab-tip">60/30/10 là tỷ lệ màu tham khảo cho tổng thể bộ phối.</p>
      </section>
    </div>
  </>;
}

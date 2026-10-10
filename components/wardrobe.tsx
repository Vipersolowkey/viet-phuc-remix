"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Shirt, Check } from "lucide-react";
import { toast } from "sonner";
import { garments, colors, accessories, type Selection, type Look } from "@/lib/remix";
import { basics, wardrobeCoverage, wardrobeSuggestions, type WardrobeItem } from "@/lib/workspace";
import { useWorkspace, WorkspaceStatus } from "./workspace-provider";
import { OutfitMockup } from "./outfit-mockup";
import { ConfirmAction } from "./confirm-action";
export function WardrobePage({ selection, onApply }: { selection: Selection; onApply: (look: Look) => void }) {
  const { data, update, busy, loading, error } = useWorkspace();
  const [garment, setGarment] = useState<Selection["garment"]>("ao-dai"), [color, setColor] = useState<Selection["color"]>("ruby"), [note, setNote] = useState(""), [editing, setEditing] = useState("");
  const [deleting, setDeleting] = useState<WardrobeItem | null>(null);
  const disabled = busy || loading || !!error, w = data.wardrobe;
  const suggestions = wardrobeSuggestions(selection, w);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const item = { id: editing || crypto.randomUUID(), garment, color, note: note.trim() };
    if (await update((state) => ({ ...state, wardrobe: { ...state.wardrobe, items: editing ? state.wardrobe.items.map((i) => i.id === editing ? item : i) : [...state.wardrobe.items, item] } }))) { setEditing(""); setNote(""); toast.success(editing ? "Đã cập nhật món đồ." : "Đã thêm vào tủ đồ."); }
  }
  return <>
    <div className="page-intro compact-intro"><div><span className="eyebrow">PHỐI TỪ NHỮNG GÌ BẠN CÓ</span><h1>Tủ đồ của mình.</h1><p>Lưu màu áo, đồ mặc cùng và phụ kiện. Dữ liệu riêng tư theo tài khoản của bạn.</p></div><Shirt size={36} /></div>
    <WorkspaceStatus />
    <div className="wardrobe-layout">
      <section className="product-panel"><h2>{editing ? "Chỉnh sửa món đồ" : "Thêm áo vào tủ"}</h2>
        <form onSubmit={submit} className="product-form"><fieldset disabled={disabled}>
          <label htmlFor="wardrobe-garment">Trang phục</label><select id="wardrobe-garment" value={garment} onChange={(e) => setGarment(e.target.value as Selection["garment"])}>{garments.map((g) => <option value={g.id} key={g.id}>{g.name}</option>)}</select>
          <label htmlFor="wardrobe-color">Màu gần nhất với áo của bạn</label><select id="wardrobe-color" value={color} onChange={(e) => setColor(e.target.value as Selection["color"])}>{colors.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
          <label htmlFor="wardrobe-note">Ghi chú <span className="input-hint">(không bắt buộc)</span></label><input id="wardrobe-note" maxLength={120} placeholder="Ví dụ: Áo lụa, tay rộng, đồ thuê…" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="product-actions"><button className="primary-button" disabled={!editing && w.items.length >= 60}><Plus size={17} />{editing ? "Lưu chỉnh sửa" : "Thêm áo"}</button>{editing && <button type="button" className="secondary-button" onClick={() => { setEditing(""); setNote(""); }}>Hủy sửa</button>}</div>
        </fieldset></form><p className="input-hint">{w.items.length}/60 áo · Màu là nhóm gần đúng, không thay thế ảnh vải thực tế.</p>
      </section>
      <section className="product-panel"><h2>Đồ mặc cùng & phụ kiện</h2><p className="input-hint">Chỉ đánh dấu món bạn đang có hoặc đã sắp xếp được.</p>
        <fieldset disabled={disabled} className="owned-options"><legend>Đồ mặc cùng</legend>{basics.map((b) => <label key={b.id}><input type="checkbox" checked={w.basics.includes(b.id)} onChange={(e) => { const checked = e.target.checked; void update((state) => ({ ...state, wardrobe: { ...state.wardrobe, basics: checked ? [...state.wardrobe.basics, b.id] : state.wardrobe.basics.filter((id) => id !== b.id) } })); }} />{b.name}</label>)}</fieldset>
        <fieldset disabled={disabled} className="owned-options"><legend>Phụ kiện</legend>{accessories.map((a) => <label key={a.id}><input type="checkbox" checked={w.accessories.includes(a.id)} onChange={(e) => { const checked = e.target.checked; void update((state) => ({ ...state, wardrobe: { ...state.wardrobe, accessories: checked ? [...state.wardrobe.accessories, a.id] : state.wardrobe.accessories.filter((id) => id !== a.id) } })); }} />{a.name}</label>)}</fieldset>
      </section>
    </div>
    <section className="product-section"><div className="section-heading"><h2>Áo của bạn <span className="input-hint">{w.items.length}</span></h2></div>
      {!w.items.length ? <div className="product-empty"><Shirt size={30} /><h3>Tủ đồ đang trống</h3><p>Thêm chiếc áo đầu tiên để nhận gợi ý dùng đồ có sẵn.</p></div> : <div className="wardrobe-items">{w.items.map((i) => <article className="wardrobe-item" key={i.id}><span className="wardrobe-color" style={{ background: colors.find((c) => c.id === i.color)!.hex }} /><div><h3>{garments.find((g) => g.id === i.garment)!.name} · {colors.find((c) => c.id === i.color)!.name}</h3><p>{i.note || "Chưa thêm ghi chú"}</p></div><button className="icon-button" aria-label={`Sửa ${garments.find((g) => g.id === i.garment)!.name} ${colors.find((c) => c.id === i.color)!.name}`} disabled={disabled} onClick={() => { setEditing(i.id); setGarment(i.garment); setColor(i.color); setNote(i.note); document.getElementById("wardrobe-garment")?.focus(); }}><Pencil size={17} /></button><button className="icon-button" aria-label={`Xóa áo ${colors.find((c) => c.id === i.color)!.name}`} disabled={disabled} onClick={() => setDeleting(i)}><Trash2 size={17} /></button></article>)}</div>}
    </section>
    {!!suggestions.length && <section className="product-section"><h2>Phối từ tủ đồ cho {selection.event === "ky-yeu" ? "buổi kỷ yếu" : "dịp đang chọn"}</h2><p className="input-hint">Ưu tiên loại áo trong Studio; dùng phụ kiện bạn đã đánh dấu có. Các món còn thiếu được liệt kê riêng.</p><div className="wardrobe-suggestions">{suggestions.map((l) => <article className="product-panel" key={l.id}><OutfitMockup selection={l} compact /><h3>{l.title}</h3><p>{l.reason}</p><WardrobeCoverage selection={l} /><button className="primary-button" onClick={() => onApply(l)}>Phối bộ này trong Studio</button></article>)}</div></section>}
    <ConfirmAction open={!!deleting} title="Xóa áo khỏi tủ đồ?" description="Các bộ phối và kế hoạch nhóm đã lưu vẫn được giữ." busy={busy} onCancel={() => setDeleting(null)} onConfirm={async () => { if (deleting && await update((state) => ({ ...state, wardrobe: { ...state.wardrobe, items: state.wardrobe.items.filter((i) => i.id !== deleting.id) } }))) { setDeleting(null); if (editing === deleting.id) { setEditing(""); setNote(""); } toast.success("Đã xóa áo khỏi tủ đồ."); } }} />
  </>;
}
export function WardrobeCoverage({ selection, onOpen }: { selection: Selection; onOpen?: () => void }) {
  const { data, loading, error } = useWorkspace();
  if (loading || error) return null;
  const empty = !data.wardrobe.items.length && !data.wardrobe.accessories.length && !data.wardrobe.basics.length;
  const coverage = wardrobeCoverage(selection, data.wardrobe);
  return <div className="coverage"><strong><Check size={15} />{empty ? "Bạn chưa nhập tủ đồ" : `Đã có ${coverage.owned.length}/${coverage.total} món theo bộ phối`}</strong>{coverage.owned.length > 0 && <p><b>Đã có:</b> {coverage.owned.join(", ")}</p>}<p>{coverage.missing.length ? <><b>{empty ? "Cần chuẩn bị:" : "Chưa đánh dấu có:"}</b> {coverage.missing.join(", ")}</> : "Đã đủ các món trong gợi ý."}</p>{onOpen && <button className="text-button" onClick={onOpen}>{empty ? "Thêm đồ mình có" : "Cập nhật tủ đồ"}</button>}</div>;
}

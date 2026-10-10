"use client";
import { ClipboardCheck } from "lucide-react";
import { garments, events, culturalNotes, type Selection } from "@/lib/remix";
import { preparationItems, preparationKey, type Preparation } from "@/lib/workspace";
import { useWorkspace, WorkspaceStatus } from "./workspace-provider";
export function EventChecklist({ selection }: { selection: Selection }) {
  const { data, loading, busy, error, update } = useWorkspace();
  const p = data.preparation, items = preparationItems(selection, p), key = preparationKey(selection, p), checked = data.checks[key] || [], completed = items.filter((i) => checked.includes(i.id)).length;
  const locked = loading || busy || !!error;
  function settings(patch: Partial<Preparation>) { void update((state) => ({ ...state, preparation: { ...state.preparation, ...patch } })); }
  const garment = garments.find((g) => g.id === selection.garment)!;
  return <section id="event-checklist" className="product-panel event-checklist" aria-label="Checklist chuẩn bị sự kiện"><div className="section-heading"><div><span className="eyebrow">TRƯỚC KHI RA KHỎI NHÀ</span><h2><ClipboardCheck size={21} />Chuẩn bị cho {events.find((e) => e.id === selection.event)!.name.toLowerCase()}</h2></div><span className="save-state">{completed}/{items.length}</span></div>
    <p className="input-hint">Theo bộ phối đang chọn. Tiến độ được lưu riêng cho từng bộ và bối cảnh.</p><WorkspaceStatus />
    <fieldset disabled={locked} className="checklist-settings product-form"><label>Không gian<select aria-label="Không gian sự kiện" value={p.environment} onChange={(e) => settings({ environment: e.target.value as Preparation["environment"] })}><option value="inside">Trong nhà</option><option value="outside">Ngoài trời</option></select></label><label>Thời tiết bạn dự kiến<select aria-label="Thời tiết dự kiến" value={p.weather} onChange={(e) => settings({ weather: e.target.value as Preparation["weather"] })}><option value="normal">Thông thường</option><option value="hot">Nắng nóng</option><option value="rain">Có thể mưa</option></select></label><label className="walking-option"><input type="checkbox" checked={p.walking} onChange={(e) => settings({ walking: e.target.checked })} />Đi bộ / đứng lâu</label></fieldset>
    <progress aria-label="Tiến độ chuẩn bị" max={items.length} value={completed} />
    <fieldset className="checklist-items" disabled={locked}><legend className="sr-only">Các việc cần chuẩn bị</legend>{items.map((i) => <label className={checked.includes(i.id) ? "checked" : ""} key={i.id}><input type="checkbox" checked={checked.includes(i.id)} onChange={(e) => { const done = e.target.checked; void update((state) => { const checks = { ...state.checks }; if (!checks[key] && Object.keys(checks).length >= 30) delete checks[Object.keys(checks)[0]]; checks[key] = done ? [...(checks[key] || []), i.id] : (checks[key] || []).filter((id) => id !== i.id); return { ...state, checks }; }); }} /><span>{i.text}</span></label>)}</fieldset>
    {completed === items.length && <p className="completion-note" role="status">Đã hoàn tất checklist. Kiểm tra lại thông tin từ nơi tổ chức trước khi đi.</p>}
    <details className="checklist-culture"><summary>Lưu ý tại sự kiện</summary><ul>{culturalNotes(selection).map((note) => <li key={note}>{note}</li>)}</ul><a href={garment.source.url} target="_blank" rel="noreferrer">Đọc về {garment.name}</a></details>
  </section>;
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { Users, Plus, Trash2, Save, ImageDown } from "lucide-react";
import { toast } from "sonner";
import { garments, colors, events, styles, accessories, type Selection, type Look } from "@/lib/remix";
import { coordinateGroup, newGroup, groupSchema, groupLooks, type GroupPlan, type Member, type GroupEditTarget, type GroupEditPatch } from "@/lib/workspace";
import { useWorkspace, WorkspaceStatus } from "./workspace-provider";
import { OutfitMockup } from "./outfit-mockup";
import { CollageDialog } from "./collage-dialog";
import { ConfirmAction } from "./confirm-action";
export function GroupStudio({ selection, onApply, onSaveLook, editPatch, onPatched }: { selection: Selection; onApply: (look: Look, target: GroupEditTarget) => void; onSaveLook: (look: Look) => Promise<void>; editPatch: GroupEditPatch | null; onPatched: () => void }) {
  const { data, loading, busy, error, update } = useWorkspace();
  const [plan, setPlan] = useState<GroupPlan>(() => newGroup(selection)), [collage, setCollage] = useState(false), [deleting, setDeleting] = useState<GroupPlan | null>(null), [pendingSwitch, setPendingSwitch] = useState<GroupPlan | null>(null), [switchOpen, setSwitchOpen] = useState(false);
  const [savedKey, setSavedKey] = useState(() => JSON.stringify(plan));
  const serialized = JSON.stringify(plan), dirty = serialized !== savedKey;
  const persisted = data.groups.some((g) => g.id === plan.id);
  const looks = useMemo(() => groupLooks(plan), [plan]);
  const valid = groupSchema.safeParse(plan).success, locked = loading || busy || !!error;
  useEffect(() => {
    if (!editPatch) return;
    if (plan.id === editPatch.target.planId && plan.members.some((m) => m.id === editPatch.target.memberId)) {
      setPlan((p) => ({ ...p, event: editPatch.selection.event, members: p.members.map((m) => m.id === editPatch.target.memberId ? { ...m, ...editPatch.selection } : { ...m, event: editPatch.selection.event }) }));
      toast.success("Đã cập nhật thành viên. Lưu kế hoạch nhóm để giữ thay đổi.");
    } else toast.error("Kế hoạch đang mở đã khác. Mở lại đúng kế hoạch để chỉnh thành viên.");
    onPatched();
  }, [editPatch]);
  useEffect(() => { if (!dirty) return; const listener = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener("beforeunload", listener); return () => window.removeEventListener("beforeunload", listener); }, [dirty]);
  function switchPlan(next: GroupPlan) {
    if (dirty) { setPendingSwitch(next); setSwitchOpen(true); } else openPlan(next);
  }
  function openPlan(next: GroupPlan) { setPlan(next); setSavedKey(JSON.stringify(next)); }
  function member(id: string, patch: Partial<Member>) { setPlan((p) => ({ ...p, members: p.members.map((m) => m.id === id ? { ...m, ...patch } : m) })); }
  async function savePlan() {
    if (!valid) { toast.error("Nhập tên kế hoạch và tên cho từng thành viên."); return; }
    if (await update((state) => ({ ...state, groups: state.groups.some((g) => g.id === plan.id) ? state.groups.map((g) => g.id === plan.id ? plan : g) : [...state.groups, plan] }))) { setSavedKey(serialized); toast.success("Đã lưu kế hoạch nhóm."); }
  }
  return <>
    <div className="page-intro compact-intro"><div><span className="eyebrow">CÙNG MỘT DỊP, MỖI NGƯỜI MỘT NÉT</span><h1>Phối đồ cùng nhóm.</h1><p>Chốt bảng màu, chỉnh từng thành viên và xuất ảnh chung cho 2–6 người.</p></div><Users size={36} /></div>
    <WorkspaceStatus />
    <div className="group-layout"><aside className="product-panel group-library"><h2>Kế hoạch của bạn</h2><p className="input-hint">{data.groups.length}/10 kế hoạch · Riêng tư trong tài khoản</p><button className="secondary-button" disabled={locked || data.groups.length >= 10} onClick={() => switchPlan(newGroup(selection))}><Plus size={17} />Kế hoạch mới</button>
      {!data.groups.length && <p className="input-hint">Lưu kế hoạch đầu tiên để mở lại lần sau.</p>}
      {data.groups.map((g) => <div className="group-library-row" key={g.id}><button className={plan.id === g.id ? "active" : ""} disabled={busy} onClick={() => switchPlan(g)}><strong>{g.name}</strong><span>{g.members.length} người · {events.find((e) => e.id === g.event)!.name}</span></button><button className="icon-button" disabled={locked} aria-label={`Xóa kế hoạch ${g.name}`} onClick={() => setDeleting(g)}><Trash2 size={17} /></button></div>)}
    </aside><section className="group-editor"><section className="product-panel group-overview" aria-label="Tổng thể bộ phối nhóm"><div className="section-heading"><h2>Tổng thể nhóm</h2><span className="input-hint">{plan.members.length} người</span></div><div className="group-preview-grid">{plan.members.map((m, i) => <button key={m.id} onClick={() => document.getElementById(`member-${m.id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })} aria-label={`Chỉnh bộ phối của ${m.name}`}><OutfitMockup selection={m} compact /><strong>{m.name.trim() || `Thành viên ${i + 1}`}</strong><span>{garments.find((g) => g.id === m.garment)!.name} · {colors.find((c) => c.id === m.color)!.name}</span></button>)}</div></section><div className="product-panel"><div className="section-heading"><h2>Thiết lập nhóm</h2><span className={`save-state ${dirty ? "dirty" : ""}`} role="status">{dirty ? "Có thay đổi chưa lưu" : persisted ? "Đã lưu kế hoạch" : "Kế hoạch mới, chưa lưu"}</span></div>
      <div className="group-settings product-form"><label>Tên kế hoạch<input aria-label="Tên kế hoạch" value={plan.name} maxLength={60} onChange={(e) => setPlan({ ...plan, name: e.target.value })} /></label><label>Dịp chung<select aria-label="Dịp chung" value={plan.event} onChange={(e) => { const event = e.target.value as Selection["event"]; setPlan({ ...plan, event, members: plan.members.map((m) => ({ ...m, event })) }); }}>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>Màu chủ đạo của nhóm<select aria-label="Màu chủ đạo của nhóm" value={plan.color} onChange={(e) => setPlan({ ...plan, color: e.target.value as Selection["color"] })}>{colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Cách phối cho nhóm<select aria-label="Cách phối cho nhóm" value={plan.mode} onChange={(e) => setPlan({ ...plan, mode: e.target.value as GroupPlan["mode"] })}><option value="same">Cùng một màu</option><option value="alternating">Xen kẽ màu chủ đạo & ngà</option><option value="varied">Nhiều màu trong cùng nhóm tông</option></select></label></div>
      <div className="product-actions"><button className="secondary-button" onClick={() => setPlan(coordinateGroup(plan))}>Áp dụng bảng màu cho cả nhóm</button><span className="input-hint">Đổi màu từng người bên dưới nếu muốn. Đây là gợi ý thẩm mỹ hiện đại.</span></div>
    </div>
    <div className="section-heading group-member-heading"><h2>Thành viên · {plan.members.length}/6</h2><button className="secondary-button" disabled={plan.members.length >= 6} onClick={() => { const m = { ...selection, event: plan.event, color: plan.color, name: `Bạn ${plan.members.length + 1}`, id: crypto.randomUUID() }; setPlan((p) => ({ ...p, members: [...p.members, coordinateGroup({ ...p, members: [...p.members, m] }).members[p.members.length]] })); }}><Plus size={17} />Thêm thành viên</button></div>
    <div className="group-members">{plan.members.map((m, index) => <article className="product-panel member-card" key={m.id} id={`member-${m.id}`}><div className="member-top"><span className="eyebrow">THÀNH VIÊN {index + 1}</span><button className="icon-button" disabled={plan.members.length <= 2} aria-label={`Bỏ thành viên ${index + 1}`} onClick={() => setPlan({ ...plan, members: plan.members.filter((x) => x.id !== m.id) })}><Trash2 size={17} /></button></div><OutfitMockup selection={m} compact />
      <div className="product-form"><label>Tên / biệt danh<input aria-label={`Tên thành viên ${index + 1}`} maxLength={24} value={m.name} onChange={(e) => member(m.id, { name: e.target.value })} /></label><div className="member-selects"><label>Trang phục<select aria-label={`Trang phục thành viên ${index + 1}`} value={m.garment} onChange={(e) => member(m.id, { garment: e.target.value as Selection["garment"] })}>{garments.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>Màu áo<select aria-label={`Màu thành viên ${index + 1}`} value={m.color} onChange={(e) => member(m.id, { color: e.target.value as Selection["color"] })}>{colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><label>Phong cách<select aria-label={`Phong cách thành viên ${index + 1}`} value={m.style} onChange={(e) => member(m.id, { style: e.target.value as Selection["style"] })}>{styles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><fieldset className="member-accessories"><legend>Phụ kiện · tối đa 3</legend>{accessories.map((a) => <label key={a.id}><input type="checkbox" aria-label={`${a.name} thành viên ${index + 1}`} checked={m.accessories.includes(a.id)} disabled={!m.accessories.includes(a.id) && m.accessories.length >= 3} onChange={(e) => member(m.id, { accessories: e.target.checked ? [...m.accessories, a.id] : m.accessories.filter((id) => id !== a.id) })} />{a.name}</label>)}</fieldset></div>
      <div className="product-actions"><button className="text-button" onClick={() => onApply(looks[index], { planId: plan.id, memberId: m.id, name: m.name })}>Chỉnh kỹ trong Studio</button><button className="text-button" disabled={locked || !valid} onClick={() => void onSaveLook(looks[index])}>Lưu bộ này vào lookbook</button></div>
    </article>)}</div>
    <div className="group-save-bar product-panel"><p>{valid ? `${plan.members.length} bộ phối cho ${events.find((e) => e.id === plan.event)!.name.toLowerCase()}` : "Cần tên kế hoạch và tên cho từng thành viên."}</p><div className="product-actions"><button className="secondary-button" disabled={!valid} onClick={() => setCollage(true)}><ImageDown size={17} />Xuất ảnh nhóm</button><button className="primary-button" disabled={locked || !valid || (!dirty && persisted) || (!data.groups.some((g) => g.id === plan.id) && data.groups.length >= 10)} onClick={savePlan}><Save size={17} />{busy ? "Đang lưu…" : "Lưu kế hoạch nhóm"}</button></div></div>
    </section></div>
    <CollageDialog open={collage} name={plan.name} looks={looks} mode="group" onClose={() => setCollage(false)} />
    <ConfirmAction open={!!deleting} title="Xóa kế hoạch nhóm?" description="Các bộ phối đã lưu vào lookbook vẫn được giữ." busy={busy} onCancel={() => setDeleting(null)} onConfirm={async () => { if (deleting && await update((state) => ({ ...state, groups: state.groups.filter((g) => g.id !== deleting.id) }))) { if (plan.id === deleting.id) { const fresh = newGroup(selection); setPlan(fresh); setSavedKey(JSON.stringify(fresh)); } setDeleting(null); toast.success("Đã xóa kế hoạch nhóm."); } }} />
    <ConfirmSwitch open={switchOpen} onCancel={() => { setSwitchOpen(false); setPendingSwitch(null); }} onSwitch={() => { if (pendingSwitch) openPlan(pendingSwitch); setPendingSwitch(null); setSwitchOpen(false); }} />
  </>;
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
function ConfirmSwitch({ open, onCancel, onSwitch }: { open: boolean; onCancel: () => void; onSwitch: () => void }) { return <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}><DialogContent><DialogHeader><DialogTitle>Kế hoạch đang có thay đổi chưa lưu</DialogTitle><DialogDescription>Lưu kế hoạch hiện tại trước khi mở kế hoạch khác, hoặc bỏ những thay đổi này.</DialogDescription></DialogHeader><div className="product-actions"><button className="primary-button" onClick={onCancel}>Quay lại chỉnh sửa</button><button className="secondary-button" onClick={onSwitch}>Bỏ thay đổi và mở</button></div></DialogContent></Dialog>; }

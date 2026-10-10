"use client";
import { useEffect, useState, type ReactNode } from "react";
import { FolderPlus, ImageDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { collectionSchema, type Collection } from "@/lib/collections";
import { CollageDialog } from "./collage-dialog";
import { ConfirmAction } from "./confirm-action";
import type { Look } from "@/lib/remix";

export function CollectionBook({ looks, renderLook }: { looks: Look[]; renderLook: (look: Look) => ReactNode }) {
  const [groups, setGroups] = useState<Collection[]>([]);
  const [active, setActive] = useState("");
  const [name, setName] = useState("");
  const [rename, setRename] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [organize, setOrganize] = useState(false);
  const [collage, setCollage] = useState(false);
  const [deleting, setDeleting] = useState<Collection | null>(null);
  const group = groups.find((g) => g.id === active);
  const visible = group ? looks.filter((l) => group.lookIds.includes(l.id)) : looks;
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/collections");
      if (!r.ok) throw new Error();
      setGroups(collectionSchema.array().max(20).parse(((await r.json()) as { collections: unknown }).collections)); setError("");
    } catch { setError("Chưa tải được bộ sưu tập. Các bộ phối đã lưu vẫn ở bên dưới."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { setRename(group?.name || ""); setOrganize(!!active); }, [active]);
  async function mutate(method: string, body?: object, id?: string) {
    if (busy) return false;
    setBusy(true);
    try {
      const r = await fetch(`/api/collections${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (r.status === 409) { toast.error("Bạn có thể tạo tối đa 20 bộ sưu tập."); return false; }
      if (!r.ok) throw new Error();
      await load(); return true;
    } catch { toast.error("Chưa lưu được thay đổi. Hãy thử lại."); return false; }
    finally { setBusy(false); }
  }
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) return;
    const id = crypto.randomUUID();
    if (await mutate("POST", { id, name: name.trim() })) { setName(""); setActive(id); setOrganize(true); toast.success("Đã tạo bộ sưu tập. Chọn các bộ phối bên dưới."); }
  }
  return <>
    <section className="collection-panel" aria-label="Quản lý bộ sưu tập">
      <div className="collection-heading"><h2>Bộ sưu tập của bạn</h2><span>{groups.length}/20</span></div>
      <form onSubmit={create} className="collection-create"><label htmlFor="collection-name" className="sr-only">Tên bộ sưu tập mới</label><input id="collection-name" placeholder="Ví dụ: Kỷ yếu, Tết, Đi Huế…" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /><button className="primary-button" disabled={busy || loading || !!error || !name.trim() || groups.length >= 20}><FolderPlus size={17} />Tạo bộ sưu tập</button></form>
      {error && <p role="status">{error} <button onClick={load} className="text-button">Thử lại</button></p>}
      <div className="collection-tabs" role="group" aria-label="Lọc bộ sưu tập"><button aria-pressed={!active} onClick={() => setActive("")}>Tất cả · {looks.length}</button>{groups.map((g) => <button key={g.id} aria-pressed={g.id === active} onClick={() => setActive(g.id)}>{g.name} · {looks.filter((l) => g.lookIds.includes(l.id)).length}</button>)}</div>
      {loading && <p role="status" className="input-hint">Đang tải bộ sưu tập…</p>}
      {group && <div className="collection-manage">
        <label htmlFor="collection-rename" className="sr-only">Đổi tên bộ sưu tập</label><input id="collection-rename" value={rename} maxLength={60} onChange={(e) => setRename(e.target.value)} />
        <button disabled={busy || !rename.trim() || rename.trim() === group.name} onClick={async () => { if (await mutate("PATCH", { action: "rename", id: group.id, name: rename.trim() })) toast.success("Đã đổi tên bộ sưu tập."); }}>Lưu tên</button>
        <button aria-expanded={organize} onClick={() => setOrganize(!organize)}>Chọn bộ phối</button>
        <button aria-label={`Xóa bộ sưu tập ${group.name}`} disabled={busy} onClick={() => setDeleting(group)}><Trash2 size={16} />Xóa bộ sưu tập</button>
      </div>}
      {group && organize && <fieldset className="collection-choices"><legend>Chọn bộ phối cho “{group.name}”</legend>{looks.length ? looks.map((l) => <label key={l.id}><input type="checkbox" checked={group.lookIds.includes(l.id)} disabled={busy} onChange={(e) => void mutate("PATCH", { action: "membership", id: group.id, lookId: l.id, included: e.target.checked })} /><span>{l.title}</span></label>) : <p>Lưu bộ phối ở Studio để thêm vào đây.</p>}</fieldset>}
      <div className="collection-export"><p>{group ? `${visible.length} bộ phối trong “${group.name}”` : `${looks.length} bộ phối đã lưu`}</p><button className="primary-button" disabled={!visible.length || busy || loading} onClick={() => setCollage(true)}><ImageDown size={17} />Xuất collage</button></div>
    </section>
    {visible.length ? <div className="looks-grid book-grid">{visible.map(renderLook)}</div> : <div className="collection-empty"><p>{group ? "Bộ sưu tập này chưa có bộ phối." : "Lưu bộ phối yêu thích từ Studio để bắt đầu."}</p>{group && <button className="text-button" onClick={() => setOrganize(true)}>Chọn bộ phối đã lưu</button>}</div>}
    <CollageDialog open={collage} name={group?.name || "Lookbook Việt phục"} looks={visible} onClose={() => setCollage(false)} />
    <ConfirmAction open={!!deleting} title="Xóa bộ sưu tập?" description="Các bộ phối bên trong vẫn được giữ trong lookbook." busy={busy} onCancel={() => setDeleting(null)} onConfirm={async () => { if (deleting && await mutate("DELETE", undefined, deleting.id)) { setActive(""); setDeleting(null); toast.success("Đã xóa bộ sưu tập. Các bộ phối vẫn được giữ."); } }} />
  </>;
}

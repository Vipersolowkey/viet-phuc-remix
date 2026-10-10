"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "./ui/dialog";
import { drawCollage } from "@/lib/collage";
import type { Look } from "@/lib/remix";
function Editor({ name, looks, mode }: { name: string; looks: Look[]; mode: "collection" | "group" }) {
  const [title, setTitle] = useState(name);
  const [ids, setIds] = useState(looks.slice(0, 6).map((l) => l.id));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const selected = looks.filter((l) => ids.includes(l.id));
  useEffect(() => {
    let canceled = false; setReady(false); setError("");
    if (!selected.length || !canvas.current) return;
    drawCollage(canvas.current, title, selected, () => !canceled, mode).then(() => { if (!canceled) setReady(true); }).catch(() => { if (!canceled) setError("Chưa tạo được collage. Hãy thử mở lại."); });
    return () => { canceled = true; };
  }, [title, ids, looks, mode]);
  async function download() {
    if (!canvas.current || !ready || busy) return; setBusy(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob((b) => b ? resolve(b) : reject(new Error()), "image/png"));
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "viet-phuc-collection.png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast.success("Đã xuất collage PNG.");
    } catch { toast.error("Chưa xuất được ảnh. Hãy thử lại."); } finally { setBusy(false); }
  }
  return <div className="poster-editor"><div className="poster-controls"><label htmlFor="collage-title">Tên trên ảnh</label><input id="collage-title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} /><fieldset className="collage-choices"><legend>Chọn 1–6 bộ phối ({selected.length}/6)</legend>{looks.map((l) => <label key={l.id}><input type="checkbox" checked={ids.includes(l.id)} disabled={!ids.includes(l.id) && ids.length >= 6} onChange={(e) => setIds((prev) => e.target.checked ? [...prev, l.id] : prev.filter((id) => id !== l.id))} />{l.title}</label>)}</fieldset><button className="primary-button" disabled={!ready || busy || !!error} onClick={download}><Download size={18} />{busy ? "Đang xuất…" : "Tải collage PNG"}</button><p role="status" className="input-hint">{error || (!selected.length ? "Chọn ít nhất một bộ phối." : ready ? `1080 × ${290 + Math.ceil(selected.length / 2) * 720} px` : "Đang chuẩn bị ảnh…")}</p></div><div className="poster-preview">{selected.length ? <canvas ref={canvas} aria-label={`Xem trước collage ${title}`} /> : <p>Chọn bộ phối để xem trước.</p>}</div></div>;
}
export function CollageDialog({ open, onClose, name, looks, mode = "collection" }: { open: boolean; onClose: () => void; name: string; looks: Look[]; mode?: "collection" | "group" }) {
  return <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}><DialogContent className="poster-dialog" showCloseButton={false}><DialogHeader><DialogTitle>{mode === "group" ? "Ảnh phối đồ nhóm" : "Collage bộ sưu tập"}</DialogTitle><DialogDescription>{mode === "group" ? "Xuất ảnh có tên thành viên, bộ phối, bảng màu và nguồn văn hóa." : "Chọn tối đa sáu look để tạo một ảnh có bảng màu và nguồn văn hóa."}</DialogDescription></DialogHeader><DialogClose className="poster-close" aria-label="Đóng collage">×</DialogClose>{open && <Editor name={name} looks={looks} mode={mode} />}</DialogContent></Dialog>;
}

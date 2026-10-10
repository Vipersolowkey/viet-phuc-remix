"use client";
import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { loadPosterFonts, drawPoster, posterSizes, type PosterLayout } from "@/lib/poster";
import type { Look } from "@/lib/remix";

function PosterEditor({ look }: { look: Look }) {
  const [title, setTitle] = useState(look.title);
  const [layout, setLayout] = useState<PosterLayout>("feed");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let canceled = false;
    setReady(false);
    loadPosterFonts().then(() => {
      if (canceled || !canvas.current) return;
      drawPoster(canvas.current, look, title, layout);
      setError(""); setReady(true);
    }).catch(() => {
      if (!canceled) setError("Chưa tạo được ảnh xem trước. Hãy thử mở lại poster.");
    });
    return () => { canceled = true; };
  }, [look, title, layout]);
  async function download() {
    if (!canvas.current || busy || !ready || error) return;
    setBusy(true);
    try {
      await loadPosterFonts();
      drawPoster(canvas.current, look, title, layout);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob((b) => b ? resolve(b) : reject(new Error("No image")), "image/png"));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `viet-phuc-${look.garment}-${layout}.png`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast.success("Đã tạo ảnh PNG. Kiểm tra mục tải xuống của trình duyệt.");
    } catch { toast.error("Chưa xuất được ảnh. Hãy thử lại."); }
    finally { setBusy(false); }
  }
  return <div className="poster-editor">
    <div className="poster-controls">
      <label htmlFor="poster-title">Tên bộ phối</label>
      <input id="poster-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder={look.title} autoComplete="off" />
      <span className="input-hint">{title.length}/80 · Để trống để dùng tên gợi ý</span>
      <span className="poster-field-label">Bố cục ảnh</span>
      <RadioGroup value={layout} onValueChange={(v) => setLayout(v as PosterLayout)} aria-label="Bố cục poster" className="poster-layouts">
        <label className={layout === "feed" ? "active" : ""}><RadioGroupItem value="feed" />Bài đăng · 4:5</label>
        <label className={layout === "story" ? "active" : ""}><RadioGroupItem value="story" />Story · 9:16</label>
      </RadioGroup>
      <button className="primary-button" onClick={download} disabled={busy || !ready || !!error}>{busy ? <LoaderCircle size={18} className="spin" /> : <Download size={18} />}{busy ? "Đang xuất ảnh…" : "Tải poster PNG"}</button>
      <p role="status" className="input-hint">{error || (!ready ? "Đang chuẩn bị phông chữ…" : `${posterSizes[layout].width} × ${posterSizes[layout].height} px`)}</p>
    </div>
    <div className="poster-preview"><canvas ref={canvas} aria-label={`Xem trước poster ${title.trim() || look.title}`}>Poster gồm bảng màu, thông tin bộ phối và nguồn văn hóa.</canvas></div>
  </div>;
}
export function PosterDialog({ look, onClose }: { look: Look | null; onClose: () => void }) {
  return <Dialog open={!!look} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="poster-dialog" showCloseButton={false}>
      <DialogHeader><DialogTitle>Tạo poster lookbook</DialogTitle><DialogDescription>Đặt tên, chọn bố cục và tải bộ phối thành ảnh.</DialogDescription></DialogHeader>
      <DialogClose className="poster-close" aria-label="Đóng poster">×</DialogClose>
      {look && <PosterEditor key={look.id} look={look} />}
    </DialogContent>
  </Dialog>;
}

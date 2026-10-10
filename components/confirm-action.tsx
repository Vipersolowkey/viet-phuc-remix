"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
export function ConfirmAction({ open, title, description, busy, onCancel, onConfirm }: { open: boolean; title: string; description: string; busy: boolean; onCancel: () => void; onConfirm: () => void | Promise<void> }) {
  return <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onCancel(); }}><DialogContent showCloseButton={false}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="product-actions"><button className="secondary-button" disabled={busy} onClick={onCancel}>Giữ lại</button><button className="primary-button" disabled={busy} onClick={onConfirm}>{busy ? "Đang xử lý…" : "Xác nhận xóa"}</button></div></DialogContent></Dialog>;
}

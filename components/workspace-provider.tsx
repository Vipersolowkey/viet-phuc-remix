"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { emptyWorkspace, workspaceSchema, type Workspace } from "@/lib/workspace";
type State = { data: Workspace; loading: boolean; busy: boolean; error: string; login: boolean; load: () => Promise<void>; update: (edit: (w: Workspace) => Workspace) => Promise<boolean> };
const Context = createContext<State | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Workspace>(emptyWorkspace), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [login, setLogin] = useState(false);
  const current = useRef({ data: emptyWorkspace, revision: 0 }), lock = useRef(false);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/workspace");
      if (r.status === 401) { setLogin(true); setError("Đăng nhập để lưu tủ đồ, kế hoạch nhóm và tiến độ của bạn."); return; }
      if (!r.ok) throw new Error();
      const body = z.object({ data: workspaceSchema, revision: z.number().int().min(0) }).parse(await r.json()); const next = body.data;
      current.current = { data: next, revision: body.revision }; setData(next); setLogin(false); setError("");
    } catch { setError("Chưa tải được dữ liệu cá nhân. Thử tải lại trước khi chỉnh sửa."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function update(edit: (w: Workspace) => Workspace) {
    if (lock.current || loading || error) return false;
    lock.current = true; setBusy(true);
    try {
      const next = workspaceSchema.parse(edit(current.current.data));
      const r = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: current.current.revision, data: next }), signal: AbortSignal.timeout(15000) });
      if (r.status === 409) { await load(); toast.error("Dữ liệu đã thay đổi ở phiên khác. Đã tải bản mới; hãy thực hiện lại thay đổi."); return false; }
      if (r.status === 401) { setLogin(true); setError("Phiên đăng nhập đã hết hạn. Đăng nhập lại để lưu."); return false; }
      if (!r.ok) throw new Error();
      const body = z.object({ revision: z.number().int().min(1) }).parse(await r.json()); current.current = { data: next, revision: body.revision }; setData(next); return true;
    } catch { setError("Chưa xác nhận được thay đổi đã lưu. Tải lại dữ liệu trước khi tiếp tục."); toast.error("Chưa xác nhận được thay đổi đã lưu. Hãy tải lại dữ liệu."); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  return <Context.Provider value={{ data, loading, busy, error, login, load, update }}>{children}</Context.Provider>;
}
export function useWorkspace() { const state = useContext(Context); if (!state) throw new Error("Missing workspace provider"); return state; }
export function WorkspaceStatus() {
  const { loading, error, login, load, busy } = useWorkspace();
  if (loading) return <p role="status" className="workspace-status">Đang tải dữ liệu cá nhân…</p>;
  if (!error) return busy ? <p role="status" className="workspace-status">Đang lưu…</p> : null;
  return <div className="workspace-status" role="status"><p>{error}</p>{login ? <a className="primary-button" href="/signin-with-chatgpt?return_to=/" target="_top">Đăng nhập với ChatGPT</a> : <button className="text-button" onClick={load}>Tải lại dữ liệu</button>}</div>;
}

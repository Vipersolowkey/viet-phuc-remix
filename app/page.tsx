"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  Flower2,
  Heart,
  Layers,
  LoaderCircle,
  Palette,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  ImageDown,
  Shirt,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster, toast } from "sonner";
import { ColorLab } from "@/components/color-lab";
import { OutfitMockup } from "@/components/outfit-mockup";
import { CollectionBook } from "@/components/collection-book";
import { PosterDialog } from "@/components/poster-dialog";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { WardrobePage, WardrobeCoverage } from "@/components/wardrobe";
import { GroupStudio } from "@/components/group-studio";
import { EventChecklist } from "@/components/event-checklist";
import { CultureQuiz } from "@/components/culture-quiz";
import { TryOn } from "@/components/try-on";
import { ConfirmAction } from "@/components/confirm-action";
import type { GroupEditTarget, GroupEditPatch } from "@/lib/workspace";
import { harmonies, outfitPalette } from "@/lib/color-lab";
import {
  garments,
  colors,
  events,
  styles,
  accessories,
  selectionSchema,
  lookSchema,
  fallbackLooks,
  culturalNotes,
  type Selection,
  type Look,
} from "@/lib/remix";
const initial: Selection = {
  garment: "ao-dai",
  event: "hoi-xuan",
  color: "ruby",
  harmony: "neutral",
  style: "thanh-lich",
  accessories: ["pearl", "bag"],
};
function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="picker" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function LookCard({
  look,
  saved,
  compared,
  onSave,
  onCompare,
  onDelete,
  onPoster,
  onApply,
  onTryOn,
}: {
  look: Look;
  saved: boolean;
  compared: boolean;
  onSave: () => void;
  onCompare: () => void;
  onDelete?: () => void;
  onPoster: () => void;
  onApply: () => void;
  onTryOn: () => void;
}) {
  const g = garments.find((g) => g.id === look.garment)!,
    c = colors.find((c) => c.id === look.color)!;
  const palette = outfitPalette(look.color, look.garment, look.harmony);
  return (
    <article className={`look-card ${compared ? "is-compared" : ""}`} data-reveal>
      <div className="look-board" style={{ background: c.tint }}>
        <span className="board-label">
          BẢNG PHỐI · {g.name.toLocaleUpperCase("vi")}
        </span>
        <OutfitMockup selection={look} compact />
        <div className="fabric-combo">
          {palette.map((p) => <span key={p.role} style={{ background: p.hex, flex: p.share }} />)}
        </div>
        <span className="board-caption">
          {c.name} / {look.garment === "tu-than" ? "Váy tối màu" : "Quần ngà"} /
          {harmonies.find((h) => h.id === (look.harmony ?? "neutral"))!.name}
        </span>
      </div>
      <div className="look-copy">
        <div className="look-topline">
          <span className="eyebrow">
            {styles.find((s) => s.id === look.style)?.name}
          </span>
          <button
            className={`icon-button ${saved ? "is-saved" : ""}`}
            aria-label={saved ? `Đã lưu ${look.title}` : `Lưu ${look.title}`}
            onClick={onSave}
            disabled={saved}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <h3>{look.title}</h3>
        <p>{look.reason}</p>
        <div className="chips">
          {look.accessories.length ? (
            look.accessories.map((a) => (
              <span key={a}>{accessories.find((x) => x.id === a)?.name}</span>
            ))
          ) : (
            <span>Không phụ kiện</span>
          )}
        </div>
        <div className="card-foot">
          <button onClick={onApply}>Dùng bộ phối này</button>
          <button
            className={compared ? "selected-text" : ""}
            onClick={onCompare}
          >
            <Layers size={15} />
            {compared ? "Bỏ so sánh" : "So sánh"}
          </button>
          <button onClick={onPoster} aria-label={`Tạo poster ${look.title}`}><ImageDown size={15} />Poster</button>
          {onDelete && (
            <button onClick={onDelete} aria-label={`Xóa ${look.title}`}>
              <Trash2 size={15} />
              Xóa
            </button>
          )}
        </div>
        <button className="tryon-card-button" onClick={onTryOn} aria-label={`Thử trên ảnh ${look.title}`}><Shirt size={15}/>Thử trên ảnh của bạn</button>
      </div>
    </article>
  );
}
export default function Home() { return <WorkspaceProvider><RemixApp /></WorkspaceProvider>; }
function RemixApp() {
  const generationVersion = useRef(0);
  const [posterLook, setPosterLook] = useState<Look | null>(null);
  const [deleteLook, setDeleteLook] = useState<Look | null>(null), [deletingLook, setDeletingLook] = useState(false);
  const savingIds = useRef(new Set<string>());
  const [groupTarget, setGroupTarget] = useState<GroupEditTarget | null>(null), [groupPatch, setGroupPatch] = useState<GroupEditPatch | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [tab, setTab] = useState("studio"),
    [selection, setSelection] = useState<Selection>(initial),
    [looks, setLooks] = useState<Look[]>(() => fallbackLooks(initial)),
    [lookbook, setLookbook] = useState<Look[]>([]),
    [compare, setCompare] = useState<Look[]>([]),
    [busy, setBusy] = useState(false),
    [provider, setProvider] = useState("Gợi ý có sẵn"),
    [notice, setNotice] = useState(""),
    [hasResult, setHasResult] = useState(false);
  const [bookNotice, setBookNotice] = useState(""),
    [bookLoading, setBookLoading] = useState(true),
    [needsLogin, setNeedsLogin] = useState(false);
  function navigate(next: string) {
    setTab(next);
    const url = new URL(window.location.href); url.searchParams.set("view", next);
    if (url.href !== window.location.href) window.history.pushState({}, "", url);
  }
  useEffect(() => {
    setClientReady(true);
    const restore = () => { const view = new URL(window.location.href).searchParams.get("view"); setTab(view && ["studio", "group", "wardrobe", "culture", "lookbook", "color-lab", "try-on"].includes(view) ? view : "studio"); };
    try { const stored = sessionStorage.getItem("vietphuc-selection"); if (stored) { const next = selectionSchema.parse(JSON.parse(stored)); setSelection(next); setLooks(fallbackLooks(next)); } } catch {}
    restore(); window.addEventListener("popstate", restore); return () => window.removeEventListener("popstate", restore);
  }, []);
  const garment = garments.find((g) => g.id === selection.garment)!,
    color = colors.find((c) => c.id === selection.color)!;
  async function loadBook() {
    setBookLoading(true);
    setBookNotice("");
    try {
      const response = await fetch("/api/lookbook");
      if (response.status === 401) {
        setNeedsLogin(true);
        setBookNotice("Đăng nhập để lưu và xem lookbook của bạn.");
        return;
      }
      if (!response.ok) throw new Error("unavailable");
      const body = (await response.json()) as { looks: unknown };
      setLookbook(lookSchema.array().max(100).parse(body.looks));
      setNeedsLogin(false);
    } catch {
      setBookNotice(
        "Chưa tải được lookbook. Thử lại để xem các bộ phối đã lưu.",
      );
    } finally {
      setBookLoading(false);
    }
  }
  useEffect(() => {
    void loadBook();
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("main [data-reveal]");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.revealState = "visible";
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    nodes.forEach((node) => {
      if (node.dataset.revealState === "visible") return;
      node.dataset.revealState = "pending";
      observer.observe(node);
    });
    const stopMotion = () => {
      if (motion.matches) {
        nodes.forEach((node) => { node.dataset.revealState = "visible"; });
        observer.disconnect();
      }
    };
    motion.addEventListener("change", stopMotion);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", stopMotion);
    };
  }, [tab, looks, lookbook]);
  function change(patch: Partial<Selection>) {
    const next = { ...selection, ...patch };
    try { sessionStorage.setItem("vietphuc-selection", JSON.stringify(next)); } catch {}
    generationVersion.current++;
    setSelection(next);
    setLooks(fallbackLooks(next));
    setProvider("Gợi ý có sẵn");
    setHasResult(false);
    setNotice("");
  }
  async function save(look: Look) {
    if (lookbook.some((l) => l.id === look.id)) { toast.info("Bộ phối này đã ở trong lookbook."); return; }
    if (savingIds.current.has(look.id)) return;
    savingIds.current.add(look.id);
    try {
      const response = await fetch("/api/lookbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(look),
      });
      if (response.status === 401) {
        setNeedsLogin(true);
        navigate("lookbook");
        setBookNotice("Đăng nhập để lưu và xem lookbook của bạn.");
        return;
      }
      if (response.status === 409) {
        toast.error("Lookbook đã đủ 100 bộ phối.");
        return;
      }
      if (!response.ok) throw new Error("save");
      setLookbook((prev) =>
        prev.some((l) => l.id === look.id) ? prev : [look, ...prev],
      );
      toast.success("Đã lưu vào lookbook của bạn.");
    } catch {
      toast.error("Chưa lưu được bộ phối. Hãy thử lại.");
    } finally { savingIds.current.delete(look.id); }
  }
  async function remove(id: string) {
    if (deletingLook) return;
    setDeletingLook(true);
    try {
      const response = await fetch(
        `/api/lookbook?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("delete");
      setLookbook((prev) => prev.filter((l) => l.id !== id));
      setCompare((c) => c.filter((l) => l.id !== id));
      toast.success("Đã xóa bộ phối.");
      setDeleteLook(null);
    } catch {
      toast.error("Chưa xóa được bộ phối. Hãy thử lại.");
    } finally { setDeletingLook(false); }
  }
  function toggleCompare(look: Look) {
    if (compare.some((l) => l.id === look.id)) {
      setCompare((c) => c.filter((l) => l.id !== look.id));
      return;
    }
    if (compare.length === 2) {
      toast.info("Bạn có thể so sánh hai bộ cùng lúc.");
      return;
    }
    setCompare((c) => [...c, look]);
  }
  async function generate() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    const input = { ...selection, accessories: [...selection.accessories] };
    const version = ++generationVersion.current;
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(18000),
      });
      if (!response.ok) throw new Error("request");
      const body = (await response.json()) as {
        looks: unknown;
        provider?: string;
        notice?: string;
      };
      if (version !== generationVersion.current) return;
      setLooks(lookSchema.array().length(3).parse(body.looks));
      setProvider(
        body.provider === "ollama" ? "Gemma" : body.provider === "gemini" ? "Gemini" : "Gợi ý có sẵn",
      );
      setNotice(typeof body.notice === "string" ? body.notice : "");
    } catch {
      if (version !== generationVersion.current) return;
      setLooks(fallbackLooks(input));
      setProvider("Gợi ý có sẵn");
      setNotice(
        "Chưa kết nối được dịch vụ. Bạn vẫn có thể dùng các phương án có sẵn.",
      );
    } finally {
      if (version === generationVersion.current) setHasResult(true);
      setBusy(false);
      if (version === generationVersion.current) {
        requestAnimationFrame(() => {
          document.getElementById("outfit-results")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            block: "start",
          });
        });
      }
    }
  }
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: object, options: object) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!ctx?.registerTool) return;
    const controller = new AbortController();
    const tool = {
      name: "configure_vietphuc_outfit",
      title: "Chọn phương án phối Việt phục",
      description: "Cập nhật lựa chọn trong studio. Chưa tạo hoặc lưu bộ phối.",
      inputSchema: {
        type: "object",
        properties: {
          garment: { type: "string", enum: garments.map((x) => x.id) },
          event: { type: "string", enum: events.map((x) => x.id) },
          color: { type: "string", enum: colors.map((x) => x.id) },
          harmony: { type: "string", enum: harmonies.map((x) => x.id), description: "Cách phối màu; mặc định trung tính." },
          style: { type: "string", enum: styles.map((x) => x.id) },
          accessories: {
            type: "array",
            items: { type: "string", enum: accessories.map((x) => x.id) },
            maxItems: 3,
            uniqueItems: true,
          },
        },
        required: ["garment", "event", "color", "style", "accessories"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input: unknown) => {
        const next = selectionSchema.parse(input);
        try { sessionStorage.setItem("vietphuc-selection", JSON.stringify(next)); } catch {}
        generationVersion.current++;
        setSelection(next);
        setLooks(fallbackLooks(next));
        setProvider("Gợi ý có sẵn");
        setNotice("");
        setHasResult(false);
        navigate("studio");
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        return { status: "configured", selection: next };
      },
    };
    try {
      Promise.resolve(
        ctx.registerTool(tool, { signal: controller.signal }),
      ).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, []);
  const renderLook = (l: Look, deletable = false) => (
    <LookCard
      key={l.id}
      look={l}
      saved={lookbook.some((x) => x.id === l.id)}
      compared={compare.some((x) => x.id === l.id)}
      onSave={() => save(l)}
      onCompare={() => toggleCompare(l)}
      onDelete={deletable ? () => setDeleteLook(l) : undefined}
      onPoster={() => setPosterLook(l)}
      onApply={() => applyLook(l)}
      onTryOn={() => { setGroupTarget(null); change({garment:l.garment,event:l.event,color:l.color,harmony:l.harmony,style:l.style,accessories:l.accessories});navigate("try-on"); }}
    />
  );
  function applyLook(l: Look) {
    setGroupTarget(null);
    change({ garment: l.garment, event: l.event, color: l.color, harmony: l.harmony, style: l.style, accessories: l.accessories });
    navigate("studio"); toast.success("Đã áp dụng bộ phối. Bạn có thể chỉnh tiếp hoặc xem checklist.");
  }
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <a className="skip-link" href="#main">
        Đến nội dung
      </a>
      <Tabs value={tab} onValueChange={navigate} className="app-tabs">
        <header className="site-header">
          <button
            className="brand"
            onClick={() => navigate("studio")}
            aria-label="Việt phục Remix, trang phối đồ"
          >
            <Flower2 size={30} />
            <span>
              việt phục<span className="brand-remix">remix.</span>
            </span>
          </button>
          <TabsList className="main-nav" variant="line">
            <TabsTrigger value="studio">Studio phối đồ</TabsTrigger>
            <TabsTrigger value="group">Phối nhóm</TabsTrigger>
            <TabsTrigger value="wardrobe">Tủ đồ</TabsTrigger>
            <TabsTrigger value="culture">Khám phá</TabsTrigger>
            <TabsTrigger value="lookbook">
              Lookbook <span className="nav-count" key={lookbook.length}>{lookbook.length}</span>
            </TabsTrigger>
          </TabsList>
          <span className="header-note">TRUYỀN THỐNG, THEO CÁCH BẠN.</span>
        </header>
        <main id="main" style={{ "--remix-tint": color.tint } as CSSProperties}>
          <TabsContent value="studio">
            <div className="page-intro compact-intro">
              <div>
                <span className="eyebrow">GÓC SÁNG TẠO CỦA BẠN</span>
                <h1>
                  Phối Việt phục cho dịp của bạn.
                </h1>
                <p>
                  Chọn Việt phục, thêm cá tính. Tìm một bộ phối cho dịp của bạn.
                </p>
              </div>
              <button className="secondary-button" onClick={() => navigate("group")}>Phối cho cả nhóm</button>
            </div>
            {groupTarget && <div className="group-edit-notice"><p>Đang chỉnh bộ phối cho <strong>{groupTarget.name}</strong>. Nếu đổi dịp, dịp chung của nhóm cũng được cập nhật.</p><div className="product-actions"><button className="primary-button" onClick={() => { setGroupPatch({ target: groupTarget, selection }); setGroupTarget(null); navigate("group"); }}>Cập nhật cho {groupTarget.name}</button><button className="text-button" onClick={() => setGroupTarget(null)}>Thoát chỉnh nhóm</button></div></div>}
            <div className="studio-grid">
              <section className="control-panel" aria-label="Tùy chỉnh bộ phối" data-reveal>
                <div className="section-heading">
                  <h2>
                    <Palette size={19} />
                    Bắt đầu phối
                  </h2>
                  <button
                    className="icon-button"
                    aria-label="Đặt lại lựa chọn"
                    onClick={() => change(initial)}
                    disabled={busy}
                  >
                    <RotateCcw size={17} />
                  </button>
                </div>
                <fieldset disabled={busy}>
                  <legend className="field-label">
                    <span>01</span>Chọn trang phục
                  </legend>
                  <RadioGroup
                    value={selection.garment}
                    onValueChange={(v) =>
                      change({ garment: v as Selection["garment"] })
                    }
                    className="garment-options"
                  >
                    {garments.map((g, i) => (
                      <label
                        key={g.id}
                        className={`garment-option ${selection.garment === g.id ? "active" : ""}`}
                      >
                        <RadioGroupItem
                          value={g.id}
                          id={`garment-${g.id}`}
                          className="sr-only"
                        />
                        <span className="garment-number">0{i + 1}</span>
                        <span>
                          <strong>{g.name}</strong>
                          <small>{g.region}</small>
                        </span>
                        {selection.garment === g.id && <Check size={17} />}
                      </label>
                    ))}
                  </RadioGroup>
                  <div className="control-section">
                    <span className="field-label">
                      <span>02</span>Dịp & phong cách
                    </span>
                    <Picker
                      label="Bạn sẽ mặc vào dịp nào?"
                      value={selection.event}
                      options={[...events]}
                      onChange={(v) =>
                        change({ event: v as Selection["event"] })
                      }
                    />
                    <Picker
                      label="Phong cách của bạn"
                      value={selection.style}
                      options={[...styles]}
                      onChange={(v) =>
                        change({ style: v as Selection["style"] })
                      }
                    />
                  </div>
                  <div className="control-section">
                    <span className="field-label">
                      <span>03</span>Màu sắc & phụ kiện
                    </span>
                    <div className="color-heading">
                      <span>Màu chủ đạo</span>
                      <strong>{color.name}</strong>
                    </div>
                    <RadioGroup
                      className="swatches"
                      value={selection.color}
                      onValueChange={(v) =>
                        change({ color: v as Selection["color"] })
                      }
                    >
                      {colors.map((c) => (
                        <label
                          className={`swatch ${selection.color === c.id ? "active" : ""}`}
                          key={c.id}
                          style={{ background: c.hex }}
                          title={c.name}
                        >
                          <RadioGroupItem
                            className="sr-only"
                            value={c.id}
                            aria-label={c.name}
                          />
                          {selection.color === c.id && (
                            <Check
                              size={19}
                              color={c.id === "ivory" ? "#612735" : "white"}
                            />
                          )}
                        </label>
                      ))}
                    </RadioGroup>
                    <div className="color-heading">
                      <span>Thêm điểm nhấn</span>
                      <small>Tối đa 3</small>
                    </div>
                    <div className="accessory-options">
                      {accessories.map((a) => (
                        <label
                          key={a.id}
                          className={
                            selection.accessories.includes(a.id) ? "chosen" : ""
                          }
                        >
                          <Checkbox
                            checked={selection.accessories.includes(a.id)}
                            disabled={
                              !selection.accessories.includes(a.id) &&
                              selection.accessories.length === 3
                            }
                            onCheckedChange={(checked) =>
                              change({
                                accessories: checked
                                  ? [...selection.accessories, a.id]
                                  : selection.accessories.filter(
                                      (id) => id !== a.id,
                                    ),
                              })
                            }
                          />
                          {a.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    className="primary-button generate-button"
                    onClick={generate}
                    disabled={busy}
                    aria-busy={busy}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={19} />
                    ) : (
                      <Sparkles size={19} />
                    )}{" "}
                    {busy ? "Đang tìm cách phối…" : "Gợi ý phối cho mình"}
                  </button>
                </fieldset>
                <button className="text-button checklist-shortcut" onClick={() => document.getElementById("event-checklist")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })}>Checklist cho dịp này</button>
                <WardrobeCoverage selection={selection} onOpen={() => navigate("wardrobe")} />
              </section>
              <section className="inspiration-panel live-mockup-panel" aria-label="Xem trước bộ phối" data-reveal>
                <OutfitMockup selection={selection} />
                <button className="secondary-button tryon-entry" onClick={()=>navigate("try-on")}><Shirt size={17}/>Thử bộ này trên ảnh</button>
              </section>
              <aside className="context-panel">
                <div className="culture-card" key={selection.garment} data-reveal>
                  <span className="eyebrow">
                    <BookOpen size={16} /> HIỂU ĐỂ MẶC ĐẸP
                  </span>
                  <h2>{garment.name}</h2>
                  <p>{garment.fact}</p>
                  <div className="fact-details">
                    <span>Đặc trưng</span>
                    <strong>{garment.signature}</strong>
                  </div>
                  <a href={garment.source.url} target="_blank" rel="noreferrer">
                    Nguồn: {garment.source.name}
                  </a>
                  <button
                    className="text-button"
                    onClick={() => navigate("culture")}
                  >
                    Khám phá câu chuyện <BookOpen size={15} />
                  </button>
                </div>
                <div className="palette-card" data-reveal>
                  <span className="eyebrow">BẢNG MÀU ĐANG CHỌN</span>
                  <div className="palette-strip">
                    {outfitPalette(selection.color, selection.garment, selection.harmony).map((p) => <span key={p.role} style={{ background: p.hex, flex: p.share }} />)}
                  </div>
                  <strong>
                    {color.name} +{" "}
                    {selection.garment === "tu-than" ? "tông tối" : "ngà"} +
                    điểm nhấn
                  </strong>
                  <p>
                    Giữ màu chủ đạo nổi bật, tiết chế màu phụ để dễ kết hợp.
                  </p>
                  <button className="text-button" onClick={() => navigate("color-lab")}><Palette size={15} />Thử trong Color Lab</button>
                </div>
                <div className="respect-note">
                  <Flower2 size={19} />
                  <p>{culturalNotes(selection)[0]}</p>
                </div>
              </aside>
            </div>
            <section className="results-section" id="outfit-results" aria-label="Kết quả phối đồ">
              <div className="results-heading">
                <div>
                  <span className="eyebrow">TỪ LỰA CHỌN ĐẾN CẢM HỨNG</span>
                  <h2>
                    {hasResult
                      ? "Các bộ phối dành cho bạn"
                      : "Một vài cách phối để bắt đầu"}
                  </h2>
                </div>
                <span className="provider-badge">
                  <Sparkles size={15} />
                  {provider}
                </span>
              </div>
              {notice && (
                <p className="result-note" role="status">
                  {notice}
                </p>
              )}
              <div className="looks-grid" key={`${hasResult}-${looks.map((l) => l.id).join("|")}`}>
                {looks.map((l) => renderLook(l))}
              </div>
              <details className="result-cultural">
                <summary><BookOpen size={18} />Lưu ý khi mặc</summary>
                <p>{culturalNotes(looks[0]).join(" ")}</p>
              </details>
            </section>
            <EventChecklist selection={selection} />
          </TabsContent>
          <TabsContent value="group" forceMount hidden={tab !== "group"}>{clientReady && <GroupStudio selection={selection} onApply={(look, target) => { applyLook(look); setGroupTarget(target); }} onSaveLook={save} editPatch={groupPatch} onPatched={() => setGroupPatch(null)} />}</TabsContent>
          <TabsContent value="wardrobe" forceMount hidden={tab !== "wardrobe"}><WardrobePage selection={selection} onApply={applyLook} /></TabsContent>
          <TabsContent value="color-lab"><button className="text-button subpage-back" onClick={() => navigate("studio")}>Về Studio phối đồ</button><ColorLab selection={selection} onApply={(patch) => { change(patch); navigate("studio"); toast.success("Đã áp dụng bảng màu vào bộ phối."); }} /></TabsContent>
          <TabsContent value="try-on" forceMount hidden={tab !== "try-on"}><TryOn selection={selection} active={tab === "try-on"} onBack={()=>navigate("studio")}/></TabsContent>
          <TabsContent value="culture" forceMount hidden={tab !== "culture"}>
            <div className="page-intro compact-intro">
              <div>
                <span className="eyebrow">CHUYỆN ĐẰNG SAU TÀ ÁO</span>
                <h1>
                  Hiểu nét xưa.
                  <br />
                  Phối chất riêng.
                </h1>
                <p>
                  Ba trang phục, những đặc trưng cần giữ và nguồn để tìm hiểu
                  thêm.
                </p>
              </div>
            </div>
            <CultureQuiz onExplore={(garment) => { change({ garment }); navigate("studio"); }} />
            <div className="culture-grid">
              {garments.map((g) => (
                <article className="culture-detail" key={g.id} data-reveal>
                  <span className="eyebrow">{g.region}</span>
                  <h2>{g.name}</h2>
                  <p>{g.fact}</p>
                  <h3>Nhận diện trang phục</h3>
                  <p>{g.signature}</p>
                  <h3>Gợi ý khi phối</h3>
                  <p>{g.advice}</p>
                  <a href={g.source.url} target="_blank" rel="noreferrer">
                    Đọc tại {g.source.name}
                  </a>
                  <button
                    className="primary-button"
                    onClick={() => {
                      change({ garment: g.id });
                      navigate("studio");
                    }}
                  >
                    Phối với {g.name.toLocaleLowerCase("vi")}
                  </button>
                </article>
              ))}
            </div>
            <div className="culture-disclaimer">
              <BookOpen size={21} />
              <p>
                Trang phục có nhiều biến thể theo thời kỳ và địa phương.
                Các cách phối ở đây mang tính đương đại.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="lookbook">
            <div className="page-intro compact-intro">
              <div>
                <span className="eyebrow">BỘ SƯU TẬP CỦA RIÊNG BẠN</span>
                <h1>Lookbook Việt phục.</h1>
                <p>
                  {lookbook.length} bộ phối đã lưu · Trong lookbook cá nhân của
                  bạn.
                </p>
              </div>
              <Bookmark size={37} />
            </div>
            {bookLoading ? (
              <p role="status">Đang tải lookbook…</p>
            ) : bookNotice ? (
              <div className="empty-book">
                <BookOpen size={35} />
                <h2>
                  {needsLogin
                    ? "Lưu nét riêng của bạn."
                    : "Chưa tải được bộ sưu tập."}
                </h2>
                <p role="status">{bookNotice}</p>
                {needsLogin ? (
                  <a
                    className="primary-button"
                    href="/signin-with-chatgpt?return_to=/"
                    target="_top"
                  >
                    Đăng nhập với ChatGPT
                  </a>
                ) : (
                  <button className="primary-button" onClick={loadBook}>
                    Thử tải lại
                  </button>
                )}
              </div>
            ) : (
              <CollectionBook looks={lookbook} renderLook={(look) => renderLook(look, true)} />
            )}
          </TabsContent>
          {compare.length > 0 && (
            <section className="comparison" aria-label="So sánh bộ phối">
              <div className="section-heading">
                <h2>
                  <Layers size={19} />
                  So sánh bộ phối ({compare.length}/2)
                </h2>
                <button
                  className="icon-button"
                  aria-label="Đóng so sánh"
                  onClick={() => setCompare([])}
                >
                  <X size={19} />
                </button>
              </div>
              <div className="comparison-grid">
                {compare.map((l) => (
                  <article key={l.id}>
                    <div>
                      <span
                        className="compare-dot"
                        style={{
                          background: colors.find((c) => c.id === l.color)?.hex,
                        }}
                      />
                      <h3>{l.title}</h3>
                      <button
                        aria-label={`Bỏ so sánh ${l.title}`}
                        onClick={() => toggleCompare(l)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <dl>
                      <dt>Trang phục</dt>
                      <dd>{garments.find((g) => g.id === l.garment)?.name}</dd>
                      <dt>Sự kiện</dt>
                      <dd>{events.find((e) => e.id === l.event)?.name}</dd>
                      <dt>Phong cách</dt>
                      <dd>{styles.find((s) => s.id === l.style)?.name}</dd>
                      <dt>Phối màu</dt><dd>{harmonies.find((h) => h.id === (l.harmony ?? "neutral"))!.name}</dd>
                      <dt>Phụ kiện</dt>
                      <dd>
                        {l.accessories
                          .map((a) => accessories.find((x) => x.id === a)?.name)
                          .join(", ") || "Không phụ kiện"}
                      </dd>
                    </dl>
                    <p>{l.reason}</p>
                  </article>
                ))}
                {compare.length === 1 && (
                  <div className="compare-empty">
                    <Layers size={27} />
                    <p>Chọn “So sánh” trên bộ phối khác để xem cạnh nhau.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
        <footer>
          <span className="footer-brand">việt phục remix.</span>
          <span>Giữ nét Việt. Thêm nét bạn.</span>
          <span>Phối đồ & khám phá văn hóa</span>
        </footer>
      </Tabs>
      <PosterDialog look={posterLook} onClose={() => setPosterLook(null)} />
      <ConfirmAction open={!!deleteLook} title="Xóa bộ phối khỏi lookbook?" description="Bộ phối cũng sẽ được gỡ khỏi các bộ sưu tập chứa nó. Kế hoạch nhóm vẫn được giữ." busy={deletingLook} onCancel={() => setDeleteLook(null)} onConfirm={() => deleteLook ? remove(deleteLook.id) : undefined} />
    </>
  );
}

import { z } from "zod";
import { selectionSchema, garments, colors, accessories, fallbackLooks, type Selection, type Look } from "./remix";

export const basics = [
  { id: "trousers", name: "Quần ngà" }, { id: "skirt", name: "Váy tối màu" },
  { id: "inner", name: "Áo trong / yếm" }, { id: "sash", name: "Thắt lưng vải" },
  { id: "shoes", name: "Giày dễ di chuyển" },
] as const;
export const wardrobeItemSchema = z.object({ id: z.string().uuid(), garment: selectionSchema.shape.garment, color: selectionSchema.shape.color, note: z.string().trim().max(120) }).strict();
export const wardrobeSchema = z.object({
  items: z.array(wardrobeItemSchema).max(60).refine((a) => new Set(a.map((i) => i.id)).size === a.length),
  accessories: z.enum(["pearl", "bag", "fan", "khan", "non", "sneaker"]).array().max(6).refine((a) => new Set(a).size === a.length),
  basics: z.enum(["trousers", "skirt", "inner", "sash", "shoes"]).array().max(5).refine((a) => new Set(a).size === a.length),
}).strict();
export const memberSchema = selectionSchema.extend({ id: z.string().uuid(), name: z.string().trim().min(1).max(24) });
export const groupSchema = z.object({
  id: z.string().uuid(), name: z.string().trim().min(1).max(60), event: selectionSchema.shape.event,
  color: selectionSchema.shape.color, mode: z.enum(["same", "alternating", "varied"]),
  members: memberSchema.array().min(2).max(6).refine((a) => new Set(a.map((i) => i.id)).size === a.length),
}).strict();
export const preparationSchema = z.object({ environment: z.enum(["inside", "outside"]), weather: z.enum(["normal", "hot", "rain"]), walking: z.boolean() }).strict();
export const workspaceSchema = z.object({
  wardrobe: wardrobeSchema,
  groups: groupSchema.array().max(10).refine((a) => new Set(a.map((i) => i.id)).size === a.length),
  preparation: preparationSchema,
  checks: z.record(z.string().max(30), z.string().min(1).max(40).array().max(16).refine((a) => new Set(a).size === a.length)).refine((x) => Object.keys(x).length <= 30),
  quiz: z.object({ best: z.number().int().min(0).max(6), attempts: z.number().int().min(0).max(10000) }).strict(),
}).strict();
export type Wardrobe = z.infer<typeof wardrobeSchema>;
export type WardrobeItem = z.infer<typeof wardrobeItemSchema>;
export type GroupPlan = z.infer<typeof groupSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Preparation = z.infer<typeof preparationSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type GroupEditTarget = { planId: string; memberId: string; name: string };
export type GroupEditPatch = { target: GroupEditTarget; selection: Selection };
export const emptyWorkspace: Workspace = { wardrobe: { items: [], accessories: [], basics: [] }, groups: [], preparation: { environment: "inside", weather: "normal", walking: false }, checks: {}, quiz: { best: 0, attempts: 0 } };
export const workspaceUpdateSchema = z.object({ revision: z.number().int().min(0), data: workspaceSchema }).strict();

export function wardrobeCoverage(s: Selection, w: Wardrobe) {
  const garmentName = garments.find((g) => g.id === s.garment)!.name;
  const colorName = colors.find((c) => c.id === s.color)!.name;
  const requirements = [
    { name: `${garmentName} · ${colorName}`, owned: w.items.some((i) => i.garment === s.garment && i.color === s.color) },
    ...(s.garment === "tu-than" ? ["inner", "skirt", "sash"] : ["trousers"]).map((id) => ({ name: basics.find((b) => b.id === id)!.name, owned: w.basics.includes(id as Wardrobe["basics"][number]) })),
    { name: s.accessories.includes("sneaker") ? "Sneaker" : "Giày dễ di chuyển", owned: s.accessories.includes("sneaker") ? w.accessories.includes("sneaker") : w.basics.includes("shoes") },
    ...s.accessories.filter((id) => id !== "sneaker").map((id) => ({ name: accessories.find((a) => a.id === id)!.name, owned: w.accessories.includes(id) })),
  ];
  return { owned: requirements.filter((r) => r.owned).map((r) => r.name), missing: requirements.filter((r) => !r.owned).map((r) => r.name), total: requirements.length };
}
export function wardrobeSuggestions(s: Selection, w: Wardrobe): Look[] {
  const variants = [...w.items].sort((a, b) => Number(b.garment === s.garment) - Number(a.garment === s.garment));
  const seen = new Set<string>();
  return variants.filter((i) => { const key = `${i.garment}:${i.color}`; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 3).map((i) => {
    const next = { ...s, garment: i.garment, color: i.color, accessories: w.accessories.filter((id) => s.style !== "truyen-thong" || id !== "sneaker").slice(0, 3) };
    const look = fallbackLooks(next)[0];
    return { ...look, title: `Từ tủ đồ · ${colors.find((c) => c.id === i.color)!.name}`, reason: `Dùng ${garments.find((g) => g.id === i.garment)!.name.toLowerCase()} đã có. ${wardrobeCoverage(next, w).missing.length ? "Xem các món còn thiếu trước khi mặc." : "Bạn đã đánh dấu có đủ các món trong gợi ý này."} Gợi ý phối đương đại, không phải phục dựng lịch sử.` };
  });
}
export function newGroup(s: Selection): GroupPlan {
  return { id: crypto.randomUUID(), name: "Kỷ yếu cùng bạn", event: "ky-yeu", color: s.color, mode: "alternating", members: [0, 1].map((i) => ({ ...s, id: crypto.randomUUID(), name: `Bạn ${i + 1}`, event: "ky-yeu", color: i ? "ivory" : s.color })) };
}
export function coordinateGroup(plan: GroupPlan): GroupPlan {
  const varied: Selection["color"][] = plan.color === "ruby" || plan.color === "rose" || plan.color === "gold" ? [plan.color, "rose", "gold", "ivory"] : [plan.color, "jade", "navy", "ivory"];
  const sequence = [...new Set(varied)];
  return { ...plan, members: plan.members.map((m, i) => ({ ...m, event: plan.event, color: plan.mode === "same" ? plan.color : plan.mode === "alternating" ? (i % 2 ? (plan.color === "ivory" ? "jade" : "ivory") : plan.color) : sequence[i % sequence.length] })) };
}
export function groupLooks(plan: GroupPlan): Look[] {
  return plan.members.map((m) => { const { id, name, ...selection } = m; const title = `${name.trim() || "Thành viên"} · ${garments.find((g) => g.id === m.garment)!.name}`; let hash = 2166136261; for (const c of JSON.stringify([title, selection])) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619); return { ...fallbackLooks({ ...selection, event: plan.event })[0], id: `group:${plan.id}:${id}:${(hash >>> 0).toString(16)}`, title }; });
}

export function preparationItems(s: Selection, p: Preparation) {
  return [
    { id: "dress-code", text: "Xác nhận dress code với nơi tổ chức hoặc người phụ trách." },
    { id: "fit", text: "Thử bộ đồ: ngồi, giơ tay và đi vài bước để kiểm tra độ thoải mái." },
    { id: "layers", text: s.garment === "tu-than" ? "Chuẩn bị áo trong / yếm, váy và thắt lưng theo bộ phối đã chọn." : "Chuẩn bị quần mặc cùng áo; kiểm tra độ dài tà và gấu quần." },
    { id: "accessories", text: s.accessories.length ? "Thử các phụ kiện cùng áo; cất món vướng hoặc khó mang theo." : "Chuẩn bị giày phù hợp với thời gian đứng và di chuyển." },
    ...(s.event === "ky-yeu" ? [{ id: "photo", text: "Chốt giờ, địa điểm chụp và bảng màu với cả nhóm." }] : []),
    ...(s.event === "dam-cuoi" ? [{ id: "host", text: "Hỏi chủ tiệc về màu dành cho khách để tránh trùng trang phục nhân vật chính." }] : []),
    ...(s.event === "di-tich" ? [{ id: "site", text: "Đọc hướng dẫn trang phục, chụp ảnh và vào nơi thờ tự tại địa điểm." }] : []),
    ...(s.event === "van-hoa" ? [{ id: "story", text: "Đọc lại nguồn văn hóa; giới thiệu rõ phần nào là phối hiện đại." }] : []),
    ...(p.environment === "outside" ? [{ id: "forecast", text: "Kiểm tra dự báo thời tiết tại địa điểm ngay trước khi đi." }] : []),
    ...(p.walking ? [{ id: "walk", text: "Thử giày trước; kiểm tra tà áo khi lên bậc thang và giữ tay rảnh khi di chuyển." }] : []),
    ...(p.weather === "hot" ? [{ id: "heat", text: "Chuẩn bị nước, quạt và thời gian nghỉ ở nơi có bóng mát." }] : p.weather === "rain" ? [{ id: "rain", text: "Chuẩn bị ô, túi bảo vệ đồ và phương án chụp hoặc di chuyển trong nhà." }] : []),
  ];
}
export function preparationKey(s: Selection, p: Preparation) {
  const value = JSON.stringify([s.garment, s.event, s.color, s.style, s.harmony, [...s.accessories].sort(), p.environment, p.weather, p.walking]);
  let hash = 2166136261; for (const c of value) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return `prep-${(hash >>> 0).toString(16)}`;
}

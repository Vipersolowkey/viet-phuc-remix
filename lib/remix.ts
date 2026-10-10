import { z } from "zod";
export const garments = [
  {
    id: "ao-dai",
    name: "Áo dài",
    region: "Việt Nam · Đương đại",
    fact: "Áo dài đã trải qua nhiều thay đổi về kiểu dáng. Trong đời sống hiện nay, áo dài xuất hiện ở trường học, lễ Tết, đám cưới và các dịp trang trọng.",
    signature: "Hai tà dài, mặc cùng quần; kiểu cổ và tay có nhiều biến thể.",
    advice:
      "Có thể phối phụ kiện tối giản. Khi đi sự kiện, hãy chọn kiểu dáng theo quy định của nơi tổ chức.",
    source: {
      name: "Vietnam Tourism",
      url: "https://vietnam.travel/node/1216",
    },
  },
  {
    id: "tu-than",
    name: "Áo tứ thân",
    region: "Bắc Bộ · Trang phục truyền thống",
    fact: "Áo tứ thân và váy từng là y phục phổ biến của phụ nữ Bắc Bộ đến đầu thế kỷ XX. Áo có hai vạt trước để buông hoặc thắt, thường kết hợp với váy và thắt lưng.",
    signature: "Bốn thân áo; hai vạt trước, áo trong, váy và thắt lưng.",
    advice:
      "Giữ cách mặc theo lớp để dễ nhận diện. Nón quai thao là một lựa chọn trong bối cảnh phù hợp, không phải phụ kiện bắt buộc cho mọi dịp.",
    source: {
      name: "Bảo tàng Phụ nữ Việt Nam",
      url: "https://baotangphunu.org.vn/thoi-trang-va-nghe-thuat-tao-hoa-van/",
    },
  },
  {
    id: "ngu-than",
    name: "Áo ngũ thân",
    region: "Gắn với Huế · Di sản may mặc",
    fact: "Áo ngũ thân có năm thân áo và năm khuy. Bảo tàng Phụ nữ Nam Bộ giới thiệu ý nghĩa biểu trưng của cấu trúc này và sự quan tâm trở lại của người trẻ.",
    signature: "Năm thân áo, cổ đứng và hàng khuy; có nhiều biến thể tay áo.",
    advice:
      "Đừng đồng nhất mọi biến thể với lễ phục cung đình. Nếu muốn phục dựng, hãy tham khảo hiện vật và người nghiên cứu trang phục.",
    source: {
      name: "Bảo tàng Phụ nữ Nam Bộ",
      url: "https://baotangphunu.com/4266-2/",
    },
  },
] as const;
export const colors = [
  { id: "ruby", name: "Đỏ rượu", hex: "#7f293d", tint: "#f4e4e7" },
  { id: "jade", name: "Xanh ngọc", hex: "#286958", tint: "#e1eee8" },
  { id: "navy", name: "Xanh chàm", hex: "#293e70", tint: "#e7eaf3" },
  { id: "rose", name: "Hồng sen", hex: "#be4c7d", tint: "#f7e6ee" },
  { id: "gold", name: "Vàng nghệ", hex: "#be8c30", tint: "#f5eddb" },
  { id: "ivory", name: "Trắng ngà", hex: "#e9e0cd", tint: "#f4f1e9" },
] as const;
export const events = [
  { id: "hoi-xuan", name: "Hội xuân / Tết" },
  { id: "ky-yeu", name: "Chụp ảnh kỷ yếu" },
  { id: "van-hoa", name: "Ngày hội văn hóa" },
  { id: "di-tich", name: "Tham quan di tích" },
  { id: "dam-cuoi", name: "Dự đám cưới" },
] as const;
export const styles = [
  { id: "thanh-lich", name: "Thanh lịch" },
  { id: "truyen-thong", name: "Gần nét truyền thống" },
  { id: "gen-z", name: "Gen Z nhẹ nhàng" },
] as const;
export const accessories = [
  { id: "pearl", name: "Ngọc trai" },
  { id: "bag", name: "Túi nhỏ" },
  { id: "fan", name: "Quạt tay" },
  { id: "khan", name: "Khăn vấn" },
  { id: "non", name: "Nón lá" },
  { id: "sneaker", name: "Sneaker" },
] as const;
export const selectionSchema = z
  .object({
    garment: z.enum(["ao-dai", "tu-than", "ngu-than"]),
    event: z.enum(["hoi-xuan", "ky-yeu", "van-hoa", "di-tich", "dam-cuoi"]),
    style: z.enum(["thanh-lich", "truyen-thong", "gen-z"]),
    color: z.enum(["ruby", "jade", "navy", "rose", "gold", "ivory"]),
    harmony: z.enum(["neutral", "analogous", "complementary"]).default("neutral"),
    accessories: z
      .array(z.enum(["pearl", "bag", "fan", "khan", "non", "sneaker"]))
      .max(3)
      .refine((a) => new Set(a).size === a.length),
  })
  .strict();
export type Selection = z.infer<typeof selectionSchema>;
export const lookSchema = selectionSchema.extend({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(80),
  reason: z.string().min(1).max(600),
});
export type Look = z.infer<typeof lookSchema>;
export function culturalNotes(s: Selection): string[] {
  const notes: string[] = [garments.find((g) => g.id === s.garment)!.advice];
  if (s.accessories.includes("sneaker"))
    notes.push(
      "Sneaker là cách phối hiện đại; không mô tả bộ này là phục dựng lịch sử. Với nghi lễ, hãy kiểm tra quy định của nơi tổ chức.",
    );
  if (s.event === "di-tich")
    notes.push(
      "Khi đến di tích hoặc nơi thờ tự, chọn trang phục kín đáo, dễ di chuyển và tuân thủ hướng dẫn tại địa điểm.",
    );
  if (s.event === "dam-cuoi" && ["ruby", "ivory"].includes(s.color))
    notes.push(
      "Hãy hỏi chủ tiệc về màu và trang phục của khách, nhất là khi chọn tông dễ trùng với cô dâu hoặc chú rể.",
    );
  if (s.garment === "tu-than" && s.accessories.includes("non"))
    notes.push(
      "Nón lá trong bộ phối này là lựa chọn cách tân, khác với nón quai thao trong một số cách mặc áo tứ thân truyền thống.",
    );
  return notes;
}
export function fallbackLooks(s: Selection): Look[] {
  const g = garments.find((g) => g.id === s.garment)!,
    e = events.find((e) => e.id === s.event)!;
  const choices: Selection["color"][] = [
    s.color,
    s.color === "ivory" ? "jade" : "ivory",
    s.color === "navy" ? "ruby" : "navy",
  ];
  const id = [
    s.garment,
    s.event,
    s.color,
    s.style,
    [...s.accessories].sort().join("-") || "none",
  ].join(":") + (s.harmony && s.harmony !== "neutral" ? `:${s.harmony}` : "");
  const base =
    s.garment === "tu-than"
      ? "Giữ áo trong và thắt lưng, phối cùng váy tối màu."
      : "Phối cùng quần ngà để làm nổi bật màu áo.";
  const accent = s.accessories.length
    ? `Điểm nhấn: ${s.accessories.map((a) => accessories.find((x) => x.id === a)!.name.toLocaleLowerCase("vi")).join(", ")}.`
    : "Không phụ kiện, để trang phục là điểm nhấn.";
  return choices.map((c, i) => ({
    ...s,
    color: c,
    id: `${id}:${i}`,
    title: `${["Nét riêng", "Nhẹ nhàng", "Có chiều sâu"][i]} · ${colors.find((x) => x.id === c)!.name}`,
    reason: `${g.name} tông ${colors.find((x) => x.id === c)!.name.toLocaleLowerCase("vi")} cho ${e.name.toLocaleLowerCase("vi")}. ${base} ${accent}`,
  }));
}

import { colors, type Selection } from "./remix";

export const harmonies = [
  { id: "neutral", name: "Trung tính", description: "Nền ngà hoặc tối màu giữ tổng thể nhẹ nhàng. Một điểm nhấn vàng dịu giúp màu áo nổi bật." },
  { id: "analogous", name: "Tương đồng", description: "Điểm nhấn cách màu chủ đạo khoảng 30° trên vòng màu. Các sắc gần nhau tạo cảm giác liền mạch." },
  { id: "complementary", name: "Bổ túc", description: "Điểm nhấn nằm đối diện màu chủ đạo trên vòng màu. Dùng lượng nhỏ để tạo tương phản mà vẫn giữ màu áo làm trung tâm." },
] as const;
export type Harmony = typeof harmonies[number]["id"];
export type PaletteColor = { hex: string; name: string; role: string; share: number };

export function hexToHsl(hex: string): [number, number, number] {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error("Invalid color");
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  if (!d) return [0, 0, l * 100];
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, d / (1 - Math.abs(2 * l - 1)) * 100, l * 100];
}
export function hslToHex(h: number, s: number, l: number) {
  h = (h % 360 + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
export function outfitPalette(colorId: Selection["color"], garment: Selection["garment"], harmony: Harmony = "neutral"): PaletteColor[] {
  const color = colors.find((c) => c.id === colorId)!;
  const [h, s] = hexToHsl(color.hex);
  const darkBase = garment === "tu-than";
  // Low-saturation ivory gets a stronger accent so it does not vanish into its base.
  const accent = harmony === "neutral" ? "#c2a472"
    : hslToHex(h + (harmony === "analogous" ? 30 : 180), Math.max(35, Math.min(s, 55)), 42);
  return [
    { hex: color.hex, name: color.name, role: "Trang phục chính", share: 60 },
    { hex: darkBase ? "#242d37" : "#ece6d8", name: darkBase ? "Tông tối" : "Ngà", role: darkBase ? "Váy / lớp nền" : "Quần / lớp nền", share: 30 },
    { hex: accent, name: harmony === "neutral" ? "Vàng dịu" : harmony === "analogous" ? "Sắc tương đồng" : "Sắc bổ túc", role: "Điểm nhấn phụ kiện", share: 10 },
  ];
}

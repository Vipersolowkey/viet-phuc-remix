import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Việt phục Remix — Studio phối đồ",
  description:
    "Khám phá áo dài, áo tứ thân và áo ngũ thân. Phối màu, phụ kiện theo sự kiện và lưu lookbook Việt phục của bạn.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

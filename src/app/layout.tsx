import type { Metadata } from "next";
import { Heebo, Noto_Sans_JP } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SideRails } from "@/components/side-rails";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

// 英数字は Heebo、日本語は Noto Sans JP で表示する
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: { default: "OTOFUND（仮）｜音楽のクラウドファンディング", template: "%s｜OTOFUND（仮）" },
  description: "アーティストとファンが一緒に音楽をつくる、音楽特化のクラウドファンディング。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJp.variable} ${heebo.variable} flex min-h-screen flex-col font-sans antialiased 2xl:px-7`}>
        <SideRails />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

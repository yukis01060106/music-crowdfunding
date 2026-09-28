import type { Metadata } from "next";
import { Heebo, Noto_Sans_JP } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SideRails } from "@/components/side-rails";
import { MotionRoot } from "@/components/motion/motion-root";
import { Toaster } from "@/components/ui/toast";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}｜音楽のクラウドファンディング`, template: `%s｜${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ja_JP",
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "音楽は、ファンとつくる。OTOFUND" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport = { themeColor: "#222222" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJp.variable} ${heebo.variable} flex min-h-screen flex-col font-sans antialiased 2xl:px-7`}>
        <a href="#main" className="sr-only z-[100] bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
          本文へスキップ
        </a>
        <MotionRoot />
        <SideRails />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}

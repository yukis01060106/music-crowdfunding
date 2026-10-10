import type { Metadata } from "next";
import { Heebo, Noto_Sans_JP } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SideRails } from "@/components/side-rails";
import { MotionRoot } from "@/components/motion/motion-root";
import { Toaster } from "@/components/ui/toast";
import { JsonLd } from "@/components/json-ld";
import { baseOpenGraph, IS_DEMO, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
  // description は各ページの metadata.description から自動で受け継ぐので、ここでは固定しない
  openGraph: { ...baseOpenGraph, images: [{ url: "/og.png", width: 1200, height: 630, alt: "音楽は、ファンとつくる。OTOFUND" }] },
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
        {IS_DEMO && process.env.NEXT_PUBLIC_STRIPE_MODE !== "live" && (
          <div role="region" aria-label="デモ版のお知らせ" className="bg-pop-yellow px-4 py-1.5 text-center text-xs font-bold text-ink">
            {process.env.NEXT_PUBLIC_STRIPE_MODE === "test"
              ? "Stripe のテストモードで動いています。実際のお金は動きません（テスト用カード 4242 4242 4242 4242）。メールの送信は行われず、記録はこのブラウザの中にだけ保存されます。"
              : "これはデモ版です。実際の決済やメールの送信は行われません。入力した内容は、このブラウザの中にだけ保存されます。"}
          </div>
        )}
        <MotionRoot />
        <SideRails />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter />
        <Toaster />
        <JsonLd
          data={[
            { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/`, logo: `${SITE_URL}/og.png` },
            { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/`, inLanguage: "ja" },
          ]}
        />
      </body>
    </html>
  );
}

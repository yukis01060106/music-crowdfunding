import type { NextConfig } from "next";

// GITHUB_PAGES=1 のときは、デモ用に GitHub Pages 向けの完全な静的サイトとして書き出す。
// 本番（Vercel など）では通常のハイブリッド構成で動かす。
const isGithubPages = process.env.GITHUB_PAGES === "1";
const basePath = isGithubPages ? "/music-crowdfunding" : "";

const nextConfig: NextConfig = {
  env: {
    // <audio> など next/link 以外で public/ のファイルを参照するときに使う
    NEXT_PUBLIC_BASE_PATH: basePath,
    // AI校正など、サーバーが必要な機能を使えるか。静的なデモでは使えない
    NEXT_PUBLIC_HAS_SERVER: isGithubPages ? "" : "1",
  },
  // *.server.ts はサーバーが必要なルート（API）。静的書き出しでは読み込まない
  pageExtensions: isGithubPages ? ["tsx", "ts"] : ["server.ts", "tsx", "ts"],
  // デモと本番で URL の形（末尾のスラッシュ）を揃える。canonical・sitemap・シェアの URL もこの形で書いている
  trailingSlash: true,
  // 本番（Vercel など）だけで送るセキュリティヘッダー。GitHub Pages は静的配信なので設定できない
  ...(!isGithubPages && {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            // ほかのサイトの枠の中に表示させない（クリックジャッキング対策）
            { key: "Content-Security-Policy", value: "frame-ancestors 'none'; frame-src https://www.youtube-nocookie.com https://player.vimeo.com" },
            { key: "X-Frame-Options", value: "DENY" },
          ],
        },
      ];
    },
  }),
  ...(isGithubPages && {
    output: "export",
    basePath,
    images: { unoptimized: true },
  }),
};

export default nextConfig;

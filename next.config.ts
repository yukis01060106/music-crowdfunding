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
  ...(isGithubPages && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;

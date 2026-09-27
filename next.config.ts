import type { NextConfig } from "next";

// GITHUB_PAGES=1 のときは、デモ用に GitHub Pages 向けの完全な静的サイトとして書き出す。
// 本番（Vercel など）では通常のハイブリッド構成で動かす。
const isGithubPages = process.env.GITHUB_PAGES === "1";

const nextConfig: NextConfig = isGithubPages
  ? {
      output: "export",
      basePath: "/music-crowdfunding",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// 管理画面・マイページ・手続きの途中の画面は検索に出さない
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/creator/", "/admin/", "/mypage/", "/login/", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

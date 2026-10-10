import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// 管理画面・マイページ・手続きの途中の画面は、各ページの noindex で検索に出さない
// （Disallow にするとクローラーが noindex を読めず、URL だけ登録されることがある）
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

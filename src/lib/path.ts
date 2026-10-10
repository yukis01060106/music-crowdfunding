/** 末尾のスラッシュをそろえて比べる（trailingSlash: true のため、usePathname は「/」で終わる） */
export const normPath = (p: string) => p.replace(/\/+$/, "") || "/";
export const samePath = (a: string, b: string) => normPath(a) === normPath(b);

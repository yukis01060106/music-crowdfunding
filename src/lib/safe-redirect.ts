/**
 * ログイン後などに移動してよい、サイト内のパスだけを返す。
 * "/\evil.com" や "/%09/evil.com" のように、ブラウザが外部 URL と解釈する値は弾く。
 * TODO: Supabase に移行したら、サーバー側のリダイレクトでも同じ関数を使う
 */
export function safeNext(raw: string | null, fallback = "/mypage"): string {
  if (!raw || typeof window === "undefined") return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

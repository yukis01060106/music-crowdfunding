/**
 * サーバーのメモリで数える、簡易な回数制限。1つの送り元と、全体の上限の2段。
 * インスタンスごとに数えるので、複数台で動かす本番では Vercel KV / Upstash などに置き換える。
 */
export function createRateLimiter({ perKey, global, windowMs = 60_000 }: { perKey: number; global: number; windowMs?: number }) {
  const hits = new Map<string, number[]>();
  let globalHits: number[] = [];
  return function limited(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    // 記録が増えすぎたら、全部ではなく期限切れのものだけ消す（本物の利用者の数を消さない）
    if (hits.size > 10_000) for (const [k, ts] of hits) if (now - ts[ts.length - 1] >= windowMs) hits.delete(k);
    if (recent.length > perKey) return true;
    // 1人が送りすぎても全員が止まらないよう、送り元ごとの上限を通った呼び出しだけを全体の数に入れる
    globalHits = globalHits.filter((t) => now - t < windowMs);
    if (globalHits.length >= global) return true;
    globalHits.push(now);
    return false;
  };
}

/**
 * 送り元。ホストが付ける値を優先する（x-forwarded-for の先頭は利用者が自由に送れる環境がある）。
 * TODO: Vercel に載せたら @vercel/functions の ipAddress(request) を使う
 */
export function clientKey(request: Request): string {
  return request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
}

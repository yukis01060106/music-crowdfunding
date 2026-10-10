/**
 * Stripe のキーから動かし方を決める（next.config とサーバーで同じ判定を使う）。
 * - "test"：テストモードのキー（sk_test_ / rk_test_）。お金は動かない
 * - "live"：本番のキー。本番に必要な仕組み（Webhook・一括請求・入金確認・ログイン）がそろうまでは、
 *           STRIPE_ALLOW_LIVE=1 を明示しない限り使わない
 * - ""：未設定（デモ）
 */
export function stripeModeFor(key: string | undefined, allowLive: string | undefined): "test" | "live" | "" {
  const k = key?.trim() ?? "";
  if (!k) return "";
  if (/^(sk|rk)_test_/.test(k)) return "test";
  return allowLive === "1" ? "live" : "";
}

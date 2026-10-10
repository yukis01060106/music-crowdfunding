// AI校正の API。Gemini の generateContent を REST で呼ぶ（SDK は入れない）。
// GitHub Pages の静的書き出しでは使えないので、拡張子 .server.ts にして
// next.config の pageExtensions でサーバー版のときだけルートとして読み込む。
import { PROOFREAD_INSTRUCTION, type ProofreadField, type ProofreadIssue, type Severity } from "@/lib/proofread";

/** 無料枠で使えるモデル。変わりやすいので環境変数で差し替えられるようにする */
// 空欄（GEMINI_MODEL=）や URL に入れられない値は既定のモデルに戻す
const DEFAULT_MODEL = "gemini-3.5-flash";
const envModel = process.env.GEMINI_MODEL?.trim();
const MODEL = envModel && /^[\w.-]+$/.test(envModel) ? envModel : DEFAULT_MODEL;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/** 1回に送る文章の上限。無料枠のトークン制限と、悪用を防ぐため */
const MAX_CHARS = 20_000;
const MAX_FIELDS = 100;
const MAX_LABEL = 100;
const MAX_BODY_BYTES = 100_000;

/**
 * 1つの送り元から呼べる回数（1分あたり）。無料枠を使い切られないための簡易な制限。
 * サーバーのインスタンスごとのメモリで数えるので、複数台で動かす本番では Vercel KV / Upstash などに置き換える。
 * TODO: Supabase Auth を入れたら、ログイン中の実行者だけが呼べるようにする（セッションを検証する）
 */
const RATE_LIMIT = 5;
/** 送り元を偽ってすり抜けられても、全体ではこれ以上呼ばせない */
const GLOBAL_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();
let globalHits: number[] = [];

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  // 記録が増えすぎたら、全部ではなく期限切れのものだけ消す（本物の利用者の数を消さない）
  if (hits.size > 10_000) for (const [k, ts] of hits) if (now - ts[ts.length - 1] >= RATE_WINDOW_MS) hits.delete(k);
  if (recent.length > RATE_LIMIT) return true;
  // 1人が送りすぎても全員が止まらないよう、送り元ごとの上限を通った呼び出しだけを全体の数に入れる
  globalHits = globalHits.filter((t) => now - t < RATE_WINDOW_MS);
  if (globalHits.length >= GLOBAL_LIMIT) return true;
  globalHits.push(now);
  return false;
}

/**
 * 送り元。ホストが付ける値を優先する（x-forwarded-for の先頭は利用者が自由に送れる環境がある）。
 * TODO: Vercel に載せたら @vercel/functions の ipAddress(request) を使う
 */
function clientKey(request: Request): string {
  return request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
}

const SEVERITIES: Severity[] = ["error", "warning", "info"];
const isText = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;

// Gemini の Schema 形式（OpenAPI のサブセット。型名は大文字）
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    issues: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          fieldId: { type: "STRING" },
          excerpt: { type: "STRING" },
          suggestion: { type: "STRING" },
          reason: { type: "STRING" },
          severity: { type: "STRING", format: "enum", enum: ["error", "warning", "info"] },
        },
        required: ["fieldId", "excerpt", "reason", "severity"],
      },
    },
  },
  required: ["issues"],
};

export async function POST(request: Request) {
  // 自サイトの画面からの呼び出しだけを受け付ける
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "この送り元からは利用できません。" }, { status: 403 });
  }
  if (rateLimited(clientKey(request))) {
    return Response.json({ error: "短い時間に何度も校正しています。1分ほど待ってからお試しください。" }, { status: 429 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ error: "文章が長すぎます。分けて校正してください。" }, { status: 413 });
  }

  // content-length を付けずに送られても上限を超えないよう、文字列で読んでから大きさを確かめる
  const rawBody = await request.text().catch(() => "");
  if (rawBody.length > MAX_BODY_BYTES) {
    return Response.json({ error: "文章が長すぎます。分けて校正してください。" }, { status: 413 });
  }
  let body: { fields?: unknown } | null = null;
  try {
    body = JSON.parse(rawBody) as { fields?: unknown };
  } catch {
    body = null;
  }
  const list: unknown[] = Array.isArray(body?.fields) ? body.fields : [];
  const fields: ProofreadField[] = list
    .filter((f): f is ProofreadField => {
      const v = f as Partial<ProofreadField> | null;
      return Boolean(v) && isText(v?.id, MAX_LABEL) && isText(v?.label, MAX_LABEL) && typeof v?.text === "string" && v.text.trim().length > 0;
    })
    .slice(0, MAX_FIELDS);
  const totalChars = fields.reduce((sum, f) => sum + f.id.length + f.label.length + f.text.length, 0);
  if (fields.length === 0) return Response.json({ issues: [] });
  if (totalChars > MAX_CHARS) {
    return Response.json({ error: `文章が長すぎます（${totalChars}文字）。${MAX_CHARS}文字以内に分けて校正してください。` }, { status: 413 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI校正の設定がまだです（GEMINI_API_KEY が未設定）。" }, { status: 503 });
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: PROOFREAD_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify({ fields }) }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);

  if (!res) return Response.json({ error: "AI校正に接続できませんでした。時間をおいてお試しください。" }, { status: 504 });
  if (res.status === 429) {
    return Response.json({ error: "AI校正の利用回数の上限に達しました。しばらくしてからお試しください。" }, { status: 429 });
  }
  if (!res.ok) return Response.json({ error: "AI校正でエラーが起きました。" }, { status: 502 });

  let raw: unknown[] = [];
  try {
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = JSON.parse(text) as { issues?: unknown };
    raw = Array.isArray(parsed.issues) ? parsed.issues : [];
  } catch {
    return Response.json({ error: "AI校正の結果を読み取れませんでした。もう一度お試しください。" }, { status: 502 });
  }

  // 形の正しいものだけを、決まった項目だけ取り出す。元の文章にない箇所を指したものは反映できないので捨てる
  const byId = new Map(fields.map((f) => [f.id, f.text]));
  const issues: ProofreadIssue[] = raw.flatMap((r) => {
    const i = r as Record<string, unknown>;
    const { fieldId, excerpt, suggestion, reason, severity } = i ?? {};
    if (typeof fieldId !== "string" || typeof excerpt !== "string" || !excerpt || typeof reason !== "string") return [];
    if (!SEVERITIES.includes(severity as Severity) || !byId.get(fieldId)?.includes(excerpt)) return [];
    return [{ fieldId, excerpt, reason, severity: severity as Severity, suggestion: typeof suggestion === "string" && suggestion ? suggestion : undefined, source: "ai" as const }];
  });

  return Response.json({ issues });
}

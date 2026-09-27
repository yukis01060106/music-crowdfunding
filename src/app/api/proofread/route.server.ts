// AI校正の API。Gemini の generateContent を REST で呼ぶ（SDK は入れない）。
// GitHub Pages の静的書き出しでは使えないので、拡張子 .server.ts にして
// next.config の pageExtensions でサーバー版のときだけルートとして読み込む。
import { PROOFREAD_INSTRUCTION, type ProofreadField, type ProofreadIssue } from "@/lib/proofread";

/** 無料枠で使えるモデル。変わりやすいので環境変数で差し替えられるようにする */
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/** 1回に送る文章の上限。無料枠のトークン制限と、悪用を防ぐため */
const MAX_CHARS = 20_000;
const MAX_FIELDS = 100;

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI校正の設定がまだです（GEMINI_API_KEY が未設定）。" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { fields?: ProofreadField[] } | null;
  const fields = (body?.fields ?? [])
    .filter((f) => typeof f?.id === "string" && typeof f?.label === "string" && typeof f?.text === "string" && f.text.trim())
    .slice(0, MAX_FIELDS);
  const totalChars = fields.reduce((sum, f) => sum + f.text.length, 0);
  if (fields.length === 0) return Response.json({ issues: [] });
  if (totalChars > MAX_CHARS) {
    return Response.json({ error: `文章が長すぎます（${totalChars}文字）。${MAX_CHARS}文字以内に分けて校正してください。` }, { status: 413 });
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

  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  let raw: Omit<ProofreadIssue, "source">[] = [];
  try {
    raw = (JSON.parse(text) as { issues?: Omit<ProofreadIssue, "source">[] }).issues ?? [];
  } catch {
    return Response.json({ error: "AI校正の結果を読み取れませんでした。もう一度お試しください。" }, { status: 502 });
  }

  // 元の文章にない箇所を指したものは、反映できないので捨てる
  const byId = new Map(fields.map((f) => [f.id, f.text]));
  const issues: ProofreadIssue[] = raw
    .filter((i) => i.excerpt && byId.get(i.fieldId)?.includes(i.excerpt))
    .map((i) => ({ ...i, suggestion: i.suggestion || undefined, source: "ai" }));

  return Response.json({ issues });
}

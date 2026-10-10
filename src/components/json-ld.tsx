/**
 * 構造化データ（JSON-LD）。検索結果のリッチ表示に使われる。値は画面と同じデータから作る。
 * script に埋め込むので、"<" をエスケープして HTML として解釈されないようにする。
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

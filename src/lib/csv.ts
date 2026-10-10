/**
 * CSV を作ってダウンロードさせる。Excel で文字化けしないよう BOM を付ける。
 * 支援者が入力した名前やコメントが「=」「+」「-」「@」で始まると、Excel で数式として実行されてしまうので、
 * 先頭に ' を付けて文字として扱わせる（CSV インジェクション対策）。
 */
function cell(v: string | number): string {
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : '""';
  let s = v;
  // 全角の「＝＋－＠」も、Excel の設定によっては数式として扱われるので同じく対策する
  if (/^[=+\-@\t\r＝＋－＠]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: (string | number)[][]): string {
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // クリック直後に解放すると、ブラウザによってはダウンロードが失敗するので少し待つ
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

// シェア用の画像（1200×630）を作る共通の処理。写真を横長に切り抜き、ロゴと短いラベルを重ねる。
// 日本語のフォントを読み込まずに済むよう、重ねる文字は英数字だけにする（タイトルは og:title で伝わる）。

import { OG_SIZE } from "./site";

export { OG_SIZE };

/** public/ の画像を data URL にする（ビルド時に読み込む） */
async function publicImage(src: string): Promise<string> {
  const buf = await readFile(path.join(process.cwd(), "public", src));
  const ext = src.endsWith(".png") ? "png" : "jpeg";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

export async function ogImage({ photo, label, badge }: { photo: string; label: string; badge?: string }) {
  const src = await publicImage(photo);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#222222" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse の中では img を使う */}
        <img src={src} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "linear-gradient(to top, rgba(34,34,34,0.9), rgba(34,34,34,0) 60%)" }} />
        {/* 標準のフォントは細字しかないので、黒い帯の上に大きめに置いて読みやすくする */}
        <div style={{ position: "absolute", left: 0, bottom: 56, display: "flex", alignItems: "center", gap: 28, background: "#222222", padding: "22px 40px 22px 56px" }}>
          <div style={{ display: "flex", color: "#ffffff", fontSize: 72, letterSpacing: 2 }}>OTOFUND</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {badge && <div style={{ display: "flex", alignSelf: "flex-start", background: "#ffd23f", color: "#222222", fontSize: 30, padding: "4px 14px" }}>{badge}</div>}
            <div style={{ display: "flex", color: "rgba(255,255,255,0.9)", fontSize: 24, letterSpacing: 4 }}>{label}</div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, display: "flex", background: "#6d3cff" }} />
      </div>
    ),
    OG_SIZE,
  );
}

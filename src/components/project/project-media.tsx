"use client";

import { useState } from "react";
import { Photo } from "@/components/ui/photo";
import { toEmbedUrl } from "@/lib/video";

/** 表紙＋ギャラリーの写真と、紹介動画。サムネイルで切り替える */
export function ProjectMedia({ title, images, videoUrl, color }: { title: string; images: string[]; videoUrl?: string; color: string }) {
  const embed = videoUrl ? toEmbedUrl(videoUrl) : null;
  // 0 番目は動画（あれば）。動画があるときは最初に動画を見せる
  const slides = [...(embed ? [{ kind: "video" as const, src: embed }] : []), ...images.map((src) => ({ kind: "image" as const, src }))];
  const [index, setIndex] = useState(0);
  const current = slides[index];

  return (
    <div>
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br sm:aspect-video ${color}`}>
        {current.kind === "video" ? (
          <iframe src={current.src} title={`${title}の紹介動画`} className="absolute inset-0 h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <div key={current.src} className="absolute inset-0 animate-fade">
            <Photo src={current.src} alt={index === 0 ? title : ""} sizes="(min-width: 1024px) 760px, 100vw" priority={index === 0} className="animate-[fade_0.4s_ease-out,kenburns_12s_ease-out_forwards]" />
          </div>
        )}
        {slides.length > 1 && (
          <>
            {(["prev", "next"] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => setIndex((i) => (i + (dir === "next" ? 1 : -1) + slides.length) % slides.length)}
                aria-label={dir === "next" ? "次の写真" : "前の写真"}
                className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow transition hover:scale-110 hover:bg-white ${dir === "next" ? "right-3" : "left-3"}`}
              >
                {dir === "next" ? "→" : "←"}
              </button>
            ))}
            <span className="absolute bottom-3 right-3 bg-ink/70 px-2 py-0.5 font-en text-xs text-white">
              {index + 1} / {slides.length}
            </span>
          </>
        )}
      </div>
      {slides.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={s.kind === "video" ? "紹介動画" : `写真 ${i + 1}`}
              aria-current={i === index}
              className={`relative h-14 w-20 shrink-0 overflow-hidden transition ${i === index ? "ring-2 ring-brand ring-offset-2" : "opacity-60 hover:opacity-100"}`}
            >
              {s.kind === "video" ? <span className="flex h-full w-full items-center justify-center bg-ink text-lg text-white">▶</span> : <Photo src={s.src} alt="" sizes="80px" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

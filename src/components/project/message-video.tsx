"use client";

import { useEffect, useRef, useState } from "react";
import { ICON, Play } from "@/components/ui/icon";
import { toEmbedUrl, withAutoplay } from "@/lib/video";

/**
 * アーティストからのメッセージ動画。最初は表紙の写真と再生ボタンだけを出し、
 * 押したときに YouTube / Vimeo を読み込む（ページを軽くし、押すまで外部に通信しない）。
 * iPhone の Safari は自動再生しないため、読み込んだあとにプレーヤーの再生ボタンをもう一度押すことになる
 */
export function MessageVideo(props: { videoUrl: string; poster?: React.ReactNode; label: string }) {
  // URL が変わったら、再生前の状態に戻す（勝手に次の動画が流れないように）
  return <Player key={toEmbedUrl(props.videoUrl) ?? ""} {...props} />;
}

function Player({ videoUrl, poster, label }: { videoUrl: string; poster?: React.ReactNode; label: string }) {
  const embed = toEmbedUrl(videoUrl);
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  // 再生ボタンが消えるので、フォーカスを動画に移す
  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);
  if (!embed) return null;

  return (
    <div className="relative aspect-video overflow-hidden border-[3px] border-ink bg-ink shadow-sticker">
      {playing ? (
        <iframe ref={frameRef} src={withAutoplay(embed)} title={label} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`${label}を再生`} className="group absolute inset-0 isolate flex flex-col items-center justify-center gap-3 text-white" data-inset-focus>
          {poster && <span className="absolute inset-0 -z-10 opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-35">{poster}</span>}
          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-ink/40 to-ink/10" aria-hidden />
          <span className="relative flex size-20 items-center justify-center rounded-full bg-pop-yellow text-ink shadow-sticker-sm transition group-hover:scale-110 sm:size-24">
            <Play {...ICON} className="ml-1 size-9 fill-current" />
          </span>
          <span className="relative bg-ink/75 px-3 py-1 font-bold tracking-[0.12em]">メッセージを再生</span>
        </button>
      )}
    </div>
  );
}

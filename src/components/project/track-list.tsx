"use client";

import { useRef, useState } from "react";
import type { Track } from "@/types";
import { assetPath } from "@/lib/asset-path";
import { formatDuration } from "@/lib/format";
import { ICON, Music2, Pause, Play } from "@/components/ui/icon";

/** 試聴プレイヤー。同時に再生するのは1曲だけ */
export function TrackList({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  function toggle(index: number) {
    const audio = audioRef.current;
    const src = tracks[index].previewUrl;
    if (!audio || !src) return;
    if (playing === index) {
      audio.pause();
      setPlaying(null);
      return;
    }
    audio.src = assetPath(src);
    void audio.play();
    setPlaying(index);
  }

  if (tracks.length === 0) return null;
  const hasDemoAudio = tracks.some((t) => t.previewUrl);

  return (
    <section className="bg-ink p-4 text-white sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 font-en text-xs font-bold uppercase tracking-[0.2em] text-pop-yellow">
        <Music2 {...ICON} className="size-4" />
        Listen
        <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-white/70">試聴する</span>
      </h2>
      <ol className="divide-y divide-white/10">
        {tracks.map((track, i) => (
          <li key={track.title} className={`flex items-center gap-3 px-2 py-2 transition ${playing === i ? "bg-white/10" : ""}`}>
            <button
              type="button"
              onClick={() => toggle(i)}
              disabled={!track.previewUrl}
              aria-label={playing === i ? `${track.title}を停止` : `${track.title}を再生`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pop-yellow text-ink transition hover:scale-105 disabled:bg-white/20 disabled:text-white/60"
            >
              {playing === i ? <Pause {...ICON} className="size-5 fill-current" /> : <Play {...ICON} className="ml-0.5 size-5 fill-current" />}
            </button>
            <span className="flex-1">{track.title}</span>
            {/* 再生中のしるし（動きを減らす設定では出さない） */}
            {playing === i && (
              <span className="flex h-4 items-end gap-0.5 motion-reduce:hidden" aria-hidden>
                {[0, 1, 2].map((b) => (
                  <span key={b} className="w-1 origin-bottom bg-pop-yellow animate-[eq_0.9s_ease-in-out_infinite]" style={{ height: "100%", animationDelay: `${b * 0.15}s` }} />
                ))}
              </span>
            )}
            <span className="text-sm text-white/70">
              {track.previewUrl ? formatDuration(track.durationSec) : "試聴準備中"}
            </span>
          </li>
        ))}
      </ol>
      {hasDemoAudio && <p className="mt-2 text-xs text-white/60">※デモ用の合成音です</p>}
      <audio ref={audioRef} onEnded={() => setPlaying(null)} />
    </section>
  );
}

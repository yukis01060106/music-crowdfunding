"use client";

import { useRef, useState } from "react";
import type { Track } from "@/types";
import { assetPath } from "@/lib/asset-path";
import { formatDuration } from "@/lib/format";

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
    <section className="border border-stone-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-stone-500">試聴する</h2>
      <ol className="divide-y divide-stone-100">
        {tracks.map((track, i) => (
          <li key={track.title} className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => toggle(i)}
              disabled={!track.previewUrl}
              aria-label={playing === i ? `${track.title}を停止` : `${track.title}を再生`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white disabled:bg-stone-300"
            >
              {playing === i ? "■" : "▶"}
            </button>
            <span className="flex-1">{track.title}</span>
            <span className="text-sm text-stone-500">
              {track.previewUrl ? formatDuration(track.durationSec) : "試聴準備中"}
            </span>
          </li>
        ))}
      </ol>
      {hasDemoAudio && <p className="mt-2 text-xs text-stone-400">※デモ用の合成音です</p>}
      <audio ref={audioRef} onEnded={() => setPlaying(null)} />
    </section>
  );
}

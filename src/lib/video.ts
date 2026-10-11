const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"];
const VIMEO_HOSTS = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"];
const YOUTUBE_ID = /^[\w-]{11}$/;

/** YouTube / Vimeo の URL を埋め込み用に変換する。対応外なら null（ホスト名まで確かめる） */
export function toEmbedUrl(url: string): string | null {
  let u: URL;
  try {
    const t = url.trim();
    // 「youtube.com/watch?v=...」のように https:// を省いて貼られても受け付ける
    u = new URL(/^[a-z][a-z\d+.-]*:/i.test(t) ? t : `https://${t}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  const parts = u.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.includes(host)) {
    // youtu.be/ID ・ watch?v=ID ・ shorts/ID ・ live/ID ・ embed/ID
    const id = host === "youtu.be" ? parts[0] : parts[0] === "watch" ? u.searchParams.get("v") : ["shorts", "live", "embed"].includes(parts[0]) ? parts[1] : null;
    return id && YOUTUBE_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (VIMEO_HOSTS.includes(host)) {
    // vimeo.com/123 ・ vimeo.com/123/限定公開のハッシュ ・ player.vimeo.com/video/123?h=ハッシュ
    const rest = parts[0] === "video" ? parts.slice(1) : parts;
    if (!rest[0] || !/^\d+$/.test(rest[0])) return null;
    const hash = rest[1] && /^\w+$/.test(rest[1]) ? rest[1] : u.searchParams.get("h");
    return `https://player.vimeo.com/video/${rest[0]}${hash && /^\w+$/.test(hash) ? `?h=${hash}` : ""}`;
  }
  return null;
}

/** 再生ボタンを押したあとに読み込むので、読み込んだらすぐ再生する（YouTube は関連動画を同じチャンネルに絞る） */
export function withAutoplay(embed: string): string {
  const sep = embed.includes("?") ? "&" : "?";
  return embed.includes("youtube") ? `${embed}${sep}autoplay=1&rel=0` : `${embed}${sep}autoplay=1`;
}

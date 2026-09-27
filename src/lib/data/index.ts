import type { Artist, Genre, Project } from "@/types";
import { artists, projects } from "./mock";

// データ取得の窓口。画面はここの関数だけを使う。
// Supabase などに移行するときは、この中身だけを差し替える。

const PUBLIC_STATUSES = new Set<Project["status"]>(["live", "succeeded", "failed"]);

export async function getPublicProjects(): Promise<Project[]> {
  return projects.filter((p) => PUBLIC_STATUSES.has(p.status));
}

export async function getProjectsByGenre(genre: Genre): Promise<Project[]> {
  return (await getPublicProjects()).filter((p) => p.genre === genre);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return projects.find((p) => p.slug === slug && PUBLIC_STATUSES.has(p.status));
}

export async function getArtists(): Promise<Artist[]> {
  return artists;
}

export async function getArtist(id: string): Promise<Artist | undefined> {
  return artists.find((a) => a.id === id);
}

export async function getProjectsByArtist(artistId: string): Promise<Project[]> {
  return (await getPublicProjects()).filter((p) => p.artistId === artistId);
}

/** 実行者の管理画面用。認証を入れたらログイン中のユーザーのプロジェクトに絞る */
export async function getCreatorProjects(): Promise<Project[]> {
  return projects.filter((p) => p.artistId === "hoshizora-radio");
}

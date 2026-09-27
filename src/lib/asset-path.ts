/** public/ のファイルへのパス。GitHub Pages では basePath を付ける */
export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}

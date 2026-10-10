import Image from "next/image";
import { assetPath } from "@/lib/asset-path";

/**
 * public/ の写真。GitHub Pages では basePath が必要なので assetPath を通す。
 * 親要素に relative と大きさを指定して使う。
 */
export function Photo({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={assetPath(src)}
      alt={alt}
      fill
      sizes={sizes}
      // 最初の画面に見える写真だけを先に読む（Next 16 では priority は非推奨）
      loading={priority ? "eager" : undefined}
      fetchPriority={priority ? "high" : undefined}
      // 読み込み中も空の白い箱に見えないよう、薄い色を敷く
      className={`bg-brand-soft object-cover ${className}`}
    />
  );
}

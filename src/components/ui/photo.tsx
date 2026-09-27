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
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}

/** 写真の上に重ねる図形ステッカー（丸・四角・三角）。装飾なので読み上げない */
type Shape = "circle" | "square" | "triangle" | "dot";
type Color = "yellow" | "pink" | "blue" | "teal" | "purple";

const FILL: Record<Color, string> = {
  yellow: "#ffd23f",
  pink: "#ff8fb1",
  blue: "#1e7be6",
  teal: "#00a58e",
  purple: "#6d3cff",
};

export function Sticker({
  shape,
  color,
  size = 48,
  rotate = 0,
  float = false,
  className = "",
}: {
  shape: Shape;
  color: Color;
  size?: number;
  rotate?: number;
  float?: boolean;
  className?: string;
}) {
  const fill = FILL[color];
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute ${float ? "animate-float" : ""} ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ["--r" as string]: `${rotate}deg` }}
    >
      {shape === "circle" && <circle cx="50" cy="50" r="50" fill={fill} />}
      {shape === "dot" && <circle cx="50" cy="50" r="30" fill={fill} />}
      {shape === "square" && <rect x="10" y="10" width="80" height="80" fill={fill} />}
      {shape === "triangle" && <path d="M15 5 L95 50 L15 95 Z" fill={fill} />}
    </svg>
  );
}

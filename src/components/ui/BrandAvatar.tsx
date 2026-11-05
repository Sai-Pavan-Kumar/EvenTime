import { useId } from "react";
import { createBrandAvatar } from "@/lib/profile/brandAvatar";

type Face = ReturnType<typeof createBrandAvatar>["face"];

function Eye({ x, face, closed, color, background }: { x: number; face: Face; closed: "happy" | "sleepy" | null; color: string; background: string }) {
  const { y, size, look } = face;
  if (closed) {
    const bend = closed === "happy" ? -size : size;
    return <path d={`M${x - size} ${y}Q${x} ${y + bend * 1.3} ${x + size} ${y}`} fill="none" stroke={color} strokeWidth={size * 0.62} strokeLinecap="round" />;
  }
  const shiftedX = x + look * size * 0.35;
  if (face.eyes === "tall") return <ellipse cx={shiftedX} cy={y} rx={size * 0.78} ry={size * 1.35} fill={color} />;
  if (face.eyes === "wide") return <ellipse cx={shiftedX} cy={y} rx={size * 1.2} ry={size * 0.9} fill={color} />;
  if (face.eyes === "pupil") {
    return (
      <>
        <circle cx={x} cy={y} r={size * 1.25} fill={color} />
        <circle cx={x + look * size * 0.45} cy={y} r={size * 0.6} fill={background} />
      </>
    );
  }
  return <circle cx={shiftedX} cy={y} r={size} fill={color} />;
}

function Mouth({ face, color }: { face: Face; color: string }) {
  const y = face.y + face.size + 6.5;
  const strokeProps = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const };
  if (face.mouth === "smile") return <path d={`M44.5 ${y}Q50 ${y + 4.5} 55.5 ${y}`} {...strokeProps} />;
  if (face.mouth === "grin") return <path d={`M44 ${y}Q50 ${y + 8} 56 ${y}Z`} fill={color} />;
  return null;
}

export function BrandAvatar({ seed, className, title }: { seed: string | null | undefined; className?: string; title?: string }) {
  const clipId = useId();
  const { background, body, feature, bodyPath, face } = createBrandAvatar(seed);
  const isWink = face.eyes === "wink";
  const closedEyes = face.eyes === "happy" || face.eyes === "sleepy" ? face.eyes : null;

  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <clipPath id={clipId}>
        <circle cx="50" cy="50" r="50" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={background} />
        <path d={bodyPath} fill={body} />
        <g transform={`rotate(${face.tilt} 50 50)`}>
          <Eye x={50 - face.gap} face={face} closed={closedEyes} color={feature} background={body} />
          <Eye x={50 + face.gap} face={face} closed={isWink ? "happy" : closedEyes} color={feature} background={body} />
          <Mouth face={face} color={feature} />
        </g>
      </g>
    </svg>
  );
}

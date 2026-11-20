// Shared pieces for every empty-state scene. The Around You street on the home page set the look:
// light brand-tinted blocks, white windows, pill clouds, people with no faces, cars with dark wheels.
// Every scene draws from here so a car on the 404 page is the same car as on the home page.

import type { ReactNode } from "react";

export type Tone = "fill-brand-primary" | "fill-brand-anchor" | "fill-brand-accent";

export function Sparkle({ x, y, tone, delay = "0s" }: { x: number; y: number; tone: string; delay?: string }) {
  return <path d={`M${x} ${y}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} className={`empty-twinkle ${tone}`} style={{ animationDelay: delay }} />;
}

export function CloudPill({ x, y, width = 60, delay = "0s" }: { x: number; y: number; width?: number; delay?: string }) {
  const height = Math.round(width / 4.4);
  return <rect x={x} y={y} width={width} height={height} rx={height / 2} className="empty-drift fill-brand-primary/10" style={{ animationDelay: delay }} />;
}

// Same car as the Around You street. Pass `className` (empty-drive / empty-drive-back) to send it along the road.
export function Car({ x = 0, groundY, tone = "fill-brand-anchor", className }: { x?: number; groundY: number; tone?: string; className?: string }) {
  return (
    <g className={className}>
      <rect x={x} y={groundY - 14} width="34" height="11" rx="4" className={tone} />
      <rect x={x + 8} y={groundY - 21} width="17" height="8" rx="3" className={tone} />
      <circle cx={x + 8} cy={groundY - 2} r="4" className="fill-brand-ink" />
      <circle cx={x + 26} cy={groundY - 2} r="4" className="fill-brand-ink" />
    </g>
  );
}

// Same person as the campus scenes: rounded body, plain dark head. `arms` are drawn by the caller,
// because each scene gives them something different to hold.
export function Person({ x, feetY, tone, children }: { x: number; feetY: number; tone: Tone; children?: ReactNode }) {
  return (
    <g>
      {children}
      <rect x={x - 9} y={feetY - 40} width="18" height="40" rx="9" className={tone} />
      <circle cx={x} cy={feetY - 50} r="10" className="fill-brand-ink/80" />
    </g>
  );
}

export function Arm({ fromX, fromY, angle, tone, length = 24 }: { fromX: number; fromY: number; angle: number; tone: Tone; length?: number }) {
  return <rect x={fromX - 3} y={fromY - length} width="6" height={length} rx="3" transform={`rotate(${angle} ${fromX} ${fromY})`} className={tone} />;
}

export function StreetLamp({ x, groundY, delay = "0s" }: { x: number; groundY: number; delay?: string }) {
  return (
    <g>
      <rect x={x - 2} y={groundY - 98} width="4" height="98" className="fill-brand-primary/40" />
      <path d={`M${x} ${groundY - 96}q0-10 14-10`} strokeWidth="4" className="fill-none stroke-brand-primary/40" />
      <circle cx={x + 16} cy={groundY - 102} r="14" className="empty-pulse fill-brand-accent/20" style={{ animationDelay: delay }} />
      <rect x={x + 8} y={groundY - 106} width="16" height="7" rx="3" className="fill-brand-accent" />
    </g>
  );
}

export function Tree({ x, groundY, size = 18 }: { x: number; groundY: number; size?: number }) {
  return (
    <g className="empty-sway" style={{ animationDuration: "4s" }}>
      <rect x={x - 2.5} y={groundY - size * 2.4} width="5" height={size * 2.4} className="fill-brand-primary/40" />
      <circle cx={x} cy={groundY - size * 2.6} r={size} className="fill-brand-anchor/40" />
    </g>
  );
}

// Lit windows are picked by a fixed rule, not Math.random, so server and client render the same city.
// `litRatio` is out of 5: the home street uses 2, a quiet city fewer.
export function Building({ x, groundY, width, height, tone, litRatio = 2 }: { x: number; groundY: number; width: number; height: number; tone: string; litRatio?: number }) {
  const windows: ReactNode[] = [];
  for (let row = groundY - height + 12; row < groundY - 16; row += 18) {
    for (let col = x + 7; col < x + width - 10; col += 13) {
      if ((col * 7 + row * 3) % 5 < litRatio) {
        windows.push(
          <rect key={`${col}-${row}`} x={col} y={row} width="6" height="6" rx="1" className="empty-pulse fill-white/80" style={{ animationDelay: `${-((col + row) % 40) / 10}s` }} />,
        );
      }
    }
  }
  return (
    <g>
      <rect x={x} y={groundY - height} width={width} height={height} rx="3" className={tone} />
      {windows}
    </g>
  );
}

export function Road({ width, groundY }: { width: number; groundY: number }) {
  return (
    <>
      <rect x="0" y={groundY} width={width} height="20" className="fill-brand-primary/10" />
      <rect x="0" y={groundY + 9} width={width} height="2" className="fill-white/70" />
    </>
  );
}

// [offset from centre, width, height]: the Around You row, gap filled. Shared so every street is the same street.
const SKYLINE: [number, number, number][] = [
  [-410, 46, 70], [-360, 30, 112], [-326, 52, 84], [-270, 34, 132], [-232, 48, 64], [-180, 28, 100], [-148, 44, 76], [-100, 30, 120],
  [-60, 44, 92], [-10, 30, 138], [26, 40, 74],
  [70, 30, 108], [104, 46, 72], [154, 30, 140], [188, 50, 88], [242, 32, 116], [278, 46, 70], [328, 30, 124], [362, 48, 82],
];

// `faded` pushes the city back so a foreground scene (a stage, a bench) reads first.
export function Skyline({ cx, groundY, litRatio = 2, faded = false }: { cx: number; groundY: number; litRatio?: number; faded?: boolean }) {
  const tones = faded ? ["fill-brand-primary/10", "fill-brand-primary/15"] : ["fill-brand-primary/20", "fill-brand-primary/30"];
  return (
    <>
      {SKYLINE.map(([dx, width, height], index) => (
        <Building key={dx} x={cx + dx} groundY={groundY} width={width} height={height} tone={tones[index % 2]} litRatio={faded ? 0 : litRatio} />
      ))}
    </>
  );
}

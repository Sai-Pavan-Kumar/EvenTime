"use client";

import type { CSSProperties, ReactNode } from "react";
import type { VehicleType } from "./trafficRules";

const WHEEL = "#1E293B";
const SPRITE_WIDTH = 50;
const SPRITE_HEIGHT = 22;

// Each body is drawn facing right with its wheels resting on y=0, about 8 to 16 units tall.
function Wheels({ positions, radius = 2 }: { positions: number[]; radius?: number }) {
  return <>{positions.map((x) => <circle key={x} cx={x} cy={-radius} r={radius} fill={WHEEL} />)}</>;
}

export function VehicleBody({ type }: { type: VehicleType }) {
  if (type === "bike") return <><rect x="3" y="-6" width="10" height="3" rx="1" fill="#F97316" /><rect x="6" y="-11" width="3" height="6" rx="1" fill="#334155" /><Wheels positions={[3, 13]} /></>;
  if (type === "auto") return <><path d="M2 -3v-5a3 3 0 0 1 3-3h7l5 8Z" fill="#22C55E" /><path d="M2 -11h10v-1H4Z" fill="#DCFCE7" /><Wheels positions={[5, 14]} /></>;
  if (type === "car") return <><rect x="1" y="-7" width="27" height="5" rx="2" fill="#FB7185" /><path d="M7 -7l3-4h9l4 4Z" fill="#FDA4AF" /><Wheels positions={[7, 22]} /></>;
  if (type === "bus") return <><rect x="1" y="-16" width="45" height="14" rx="2" fill="#6C47FF" /><rect x="5" y="-14" width="36" height="5" fill="#E8E5FF" /><Wheels positions={[10, 37]} radius={2.5} /></>;
  return <><rect x="1" y="-17" width="30" height="15" fill="#E2E8F0" /><path d="M32 -2v-11h7l5 5v6Z" fill="#475569" /><Wheels positions={[8, 24, 37]} radius={2.5} /></>;
}

export function Sprite({ scale, children, style, ...rest }: { scale: number; children: ReactNode; style: CSSProperties; [key: `data-${string}`]: string }) {
  return (
    <svg {...rest} viewBox={`-2 -20 ${SPRITE_WIDTH} ${SPRITE_HEIGHT}`} width={SPRITE_WIDTH * scale} height={SPRITE_HEIGHT * scale} className="absolute left-0 overflow-visible" style={style}>
      {children}
    </svg>
  );
}

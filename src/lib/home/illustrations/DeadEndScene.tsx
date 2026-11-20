// 404: the road just ends. A car waits at the barrier with its hazards on, the signpost can't agree
// on a way, and past the barrier a detour sign points back, which is what the page's buttons offer.

import { SCENE_WIDTH } from "./ResponsiveScene";
import { Car, CloudPill, Sparkle, StreetLamp, Tree } from "./parts";

const GROUND_Y = 200;

function Barrier({ x }: { x: number }) {
  return (
    <>
      <rect x={x + 8} y={GROUND_Y - 44} width="6" height="44" className="fill-brand-primary/40" />
      <rect x={x + 78} y={GROUND_Y - 44} width="6" height="44" className="fill-brand-primary/40" />
      <rect x={x} y={GROUND_Y - 64} width="92" height="22" rx="4" className="fill-white" />
      {[0, 1, 2, 3].map((i) => (
        <polygon key={i} points={`${x + 8 + i * 22},${GROUND_Y - 64} ${x + 20 + i * 22},${GROUND_Y - 64} ${x + 10 + i * 22},${GROUND_Y - 42} ${x - 2 + i * 22},${GROUND_Y - 42}`} className="fill-brand-accent" />
      ))}
      <circle cx={x + 4} cy={GROUND_Y - 70} r="5" className="empty-blink fill-brand-accent" />
      <circle cx={x + 88} cy={GROUND_Y - 70} r="5" className="empty-blink fill-brand-accent" style={{ animationDelay: "-0.5s" }} />
    </>
  );
}

function Signpost({ x }: { x: number }) {
  return (
    <>
      <rect x={x - 3} y="60" width="6" height={GROUND_Y - 60} rx="3" className="fill-brand-primary/40" />
      <g className="empty-sway" style={{ animationDuration: "3s" }}>
        <polygon points={`${x},64 ${x + 59},64 ${x + 71},77 ${x + 59},90 ${x},90`} className="fill-brand-primary" />
      </g>
      <g className="empty-sway" style={{ animationDuration: "3s", animationDirection: "alternate-reverse" }}>
        <polygon points={`${x},98 ${x - 59},98 ${x - 71},111 ${x - 59},124 ${x},124`} className="fill-brand-anchor" />
      </g>
    </>
  );
}

function DetourSign({ x }: { x: number }) {
  return (
    <>
      <rect x={x + 18} y="110" width="5" height={GROUND_Y - 110} className="fill-brand-primary/40" />
      <rect x={x} y="82" width="42" height="34" rx="6" className="fill-brand-anchor" />
      <path d={`M${x + 32} 106v-6a8 8 0 0 0-8-8h-14m5-6-6 6 6 6`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="empty-blink fill-none stroke-white" style={{ animationDuration: "2.2s" }} />
    </>
  );
}

export function DeadEndScene({ width }: { width: number }) {
  const cx = width / 2;
  const isWide = width > SCENE_WIDTH.phone;
  const roadEnd = cx + 96;
  return (
    <>
      <CloudPill x={cx - 220} y={40} width={70} />
      <CloudPill x={cx + 60} y={30} width={52} delay="-4s" />
      <Sparkle x={cx + 170} y={46} tone="fill-brand-anchor" />

      {/* The road runs in from the left and stops at the barrier; grass beyond. */}
      <rect x="0" y={GROUND_Y} width={roadEnd} height="20" className="fill-brand-primary/10" />
      <rect x="0" y={GROUND_Y + 9} width={roadEnd - 10} height="2" className="fill-white/70" />
      <rect x={roadEnd} y={GROUND_Y + 6} width={width - roadEnd} height="14" className="fill-brand-anchor/10" />

      <StreetLamp x={cx - 250} groundY={GROUND_Y} />
      <StreetLamp x={cx - 10} groundY={GROUND_Y} delay="-1s" />
      <Signpost x={cx - 89} />

      {/* Stopped car, hazards blinking */}
      <Car x={cx - 190} groundY={GROUND_Y} />
      <circle cx={cx - 157} cy={GROUND_Y - 10} r="2.5" className="empty-blink fill-brand-accent" />

      <polygon points={`${cx + 30},${GROUND_Y - 2} ${cx + 44},${GROUND_Y - 44} ${cx + 58},${GROUND_Y - 2}`} className="fill-brand-accent" />
      <rect x={cx + 35} y={GROUND_Y - 26} width="18" height="6" className="fill-white" />
      <rect x={cx + 24} y={GROUND_Y - 4} width="40" height="6" rx="2" className="fill-brand-accent" />

      <Barrier x={cx + 88} />
      {isWide && (
        <>
          <DetourSign x={cx + 196} />
          <Tree x={cx + 252} groundY={GROUND_Y + 6} size={13} />
        </>
      )}
    </>
  );
}

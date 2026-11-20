// Leaderboard with nobody ranked yet: an empty podium, a spotlight that keeps finding the #1 step,
// and the trophy hovering over it, waiting for the first person to claim it.
// Confetti is laid out but not fired. Built around the centre, like the other scenes.

import { ResponsiveScene, SCENE_WIDTH } from "./ResponsiveScene";
import { Arm, Person, Sparkle } from "./parts";

const GROUND_Y = 200;

// [offset from centre, top y, tone, label]
const STEPS: [number, number, string, string][] = [
  [-120, 146, "fill-brand-primary/60", "2"],
  [-40, 120, "fill-brand-primary", "1"],
  [40, 164, "fill-brand-primary/40", "3"],
];

const CONFETTI: [number, number, number, string][] = [
  [-200, 188, 20, "fill-brand-accent"], [-176, 194, -30, "fill-brand-anchor"], [-154, 186, 50, "fill-brand-primary"],
  [150, 190, -20, "fill-brand-anchor"], [174, 186, 35, "fill-brand-accent"], [196, 194, -60, "fill-brand-primary"],
];

// Three tiers of empty seats: tallest at the card edge, stepping down toward the stage.
// Phones pass a small `step` so the stands stay narrow beside the podium.
// `side` is 1 for the left stand (grows rightward from the edge) and -1 for the right one.
function Bleachers({ edgeX, side, step = 40 }: { edgeX: number; side: 1 | -1; step?: number }) {
  return (
    <>
      {[2, 1, 0].map((tier) => {
        const top = 130 + tier * 24;
        const span = 60 + tier * step;
        const x = side === 1 ? edgeX : edgeX - span;
        return (
          <g key={tier}>
            <rect x={x} y={top} width={span} height={GROUND_Y - top} className={tier % 2 ? "fill-brand-primary/15" : "fill-brand-primary/25"} />
            {Array.from({ length: Math.floor(span / 22) }, (_, i) => (
              <rect key={i} x={x + 6 + i * 22} y={top - 8} width="14" height="9" rx="3" className="fill-brand-deep/30" />
            ))}
          </g>
        );
      })}
    </>
  );
}

// Wide screens only: the crowd has not shown up yet. One early fan waves a flag on the left;
// on the right the scoreboard waits at zero and a camera is set up for the first winner.
function Stands({ cx }: { cx: number }) {
  const left = cx - 360;
  const right = cx + 360;
  return (
    <>
      <Bleachers edgeX={left} side={1} />
      <Bleachers edgeX={right} side={-1} />

      {/* One early fan on the top step, flag going. */}
      <Person x={left + 30} feetY={130} tone="fill-brand-anchor">
        <Arm fromX={left + 36} fromY={100} angle={20} tone="fill-brand-anchor" />
      </Person>
      <rect x={left + 42} y="56" width="3" height="46" className="fill-brand-primary/40" />
      <g className="empty-sway" style={{ animationDuration: "1.6s" }}>
        <path d={`M${left + 45} 56q14-6 28 0t28 0v20q-14 6-28 0t-28 0z`} className="fill-brand-primary" />
      </g>

      <rect x={right - 128} y="20" width="96" height="58" rx="8" className="fill-brand-ink/85" />
      <rect x={right - 120} y="28" width="80" height="12" rx="3" className="fill-white/15" />
      <text x={right - 80} y="68" textAnchor="middle" fontSize="22" fontWeight="800" className="empty-blink fill-brand-accent font-heading" style={{ animationDuration: "2.4s" }}>
        0 pts
      </text>
      <rect x={right - 84} y="78" width="6" height="44" className="fill-brand-primary/40" />

      <path d={`M${right - 166} 196l12-40 12 40M${right - 154} 156v40`} strokeWidth="3" strokeLinecap="round" className="fill-none stroke-brand-primary/40" />
      <rect x={right - 178} y="130" width="44" height="28" rx="6" className="fill-brand-ink/80" />
      <circle cx={right - 182} cy="144" r="9" className="fill-brand-anchor" />
      <circle cx={right - 182} cy="144" r="4" className="fill-white/70" />
      <circle cx={right - 140} cy="136" r="3" className="empty-blink fill-red-500" />
    </>
  );
}

function PodiumScene({ width }: { width: number }) {
  const cx = width / 2;
  return (
    <>
      {width > SCENE_WIDTH.phone ? (
        <Stands cx={cx} />
      ) : (
        <>
          <Bleachers edgeX={0} side={1} step={12} />
          <Bleachers edgeX={width} side={-1} step={12} />
        </>
      )}

      {/* Spotlight swings across the stage and passes back over the top step. */}
      <g className="empty-beam" style={{ transformOrigin: `${cx}px -20px`, animationDuration: "6s" }}>
        <polygon points={`${cx - 8},-20 ${cx + 8},-20 ${cx + 56},${GROUND_Y - 80} ${cx - 56},${GROUND_Y - 80}`} className="fill-brand-accent/15" />
      </g>

      <ellipse cx={cx} cy={GROUND_Y} rx="150" ry="8" className="fill-brand-primary/10" />
      {STEPS.map(([dx, top, tone, label]) => (
        <g key={label}>
          <rect x={cx + dx} y={top} width="80" height={GROUND_Y - top} rx="4" className={tone} />
          <rect x={cx + dx} y={top} width="80" height="6" rx="3" className="fill-white/30" />
          <text x={cx + dx + 40} y={top + 30} textAnchor="middle" className="fill-white font-heading" fontSize="18" fontWeight="800">
            {label}
          </text>
        </g>
      ))}

      {/* Trophy hovering over #1: nobody has claimed it yet. */}
      <g className="empty-float" style={{ animationDuration: "3.6s" }}>
        <path d={`M${cx - 18} 52h36v14a18 18 0 0 1-36 0z`} className="fill-brand-accent" />
        <path d={`M${cx - 18} 58h-8a8 8 0 0 0 8 12M${cx + 18} 58h8a8 8 0 0 1-8 12`} strokeWidth="4" strokeLinecap="round" className="fill-none stroke-brand-accent" />
        <rect x={cx - 3} y="83" width="6" height="10" className="fill-brand-accent" />
        <rect x={cx - 14} y="92" width="28" height="7" rx="2" className="fill-brand-deep" />
        <path d={`M${cx - 10} 58v8a10 10 0 0 0 4 8`} strokeWidth="3" strokeLinecap="round" className="fill-none stroke-white/40" />
      </g>
      <ellipse cx={cx} cy="116" rx="18" ry="3" className="empty-pulse fill-brand-ink/15" />
      <Sparkle x={cx - 38} y={50} tone="fill-brand-accent" />
      <Sparkle x={cx + 34} y={70} tone="fill-brand-anchor" delay="-1.2s" />

      {CONFETTI.map(([dx, y, angle, tone]) => (
        <rect key={dx} x={cx + dx} y={y} width="10" height="5" rx="1" transform={`rotate(${angle} ${cx + dx + 5} ${y + 2})`} className={tone} />
      ))}
    </>
  );
}

export function LeaderboardIllustration() {
  return <ResponsiveScene render={(layout) => <PodiumScene width={SCENE_WIDTH[layout]} />} />;
}

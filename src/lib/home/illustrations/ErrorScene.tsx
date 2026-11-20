// Error page: the plug keeps reaching for the socket and falling just short (the glitch), while
// someone from the crew is already at the socket with a wrench. Wide screens add the street pole the
// cable runs from and the crew's kit.

import { SCENE_WIDTH } from "./ResponsiveScene";
import { Arm, Person, Sparkle } from "./parts";

const GROUND_Y = 200;

// Open-end wrench drawn along +x (ring end at 0, jaw at 80), so one rotate() aims it anywhere.
const WRENCH_JAW = "M92.65 -6H78V6H92.65A14 14 0 1 1 92.65 -6Z";

function Wrench({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(0.6)`}>
      <rect x="0" y="-5" width="70" height="10" rx="5" className="fill-brand-anchor" />
      <path d={WRENCH_JAW} className="fill-brand-anchor" />
      <circle cx="0" cy="0" r="8" className="fill-brand-anchor" />
    </g>
  );
}

// The fixer faces the socket; the arm and wrench turn together like they are tightening something.
function Fixer({ x }: { x: number }) {
  const shoulderY = GROUND_Y - 32;
  return (
    <Person x={x} feetY={GROUND_Y} tone="fill-brand-anchor">
      <g className="empty-rock" style={{ animationDuration: "1.2s", transformOrigin: `${x - 6}px ${shoulderY}px`, transformBox: "view-box" }}>
        <Arm fromX={x - 6} fromY={shoulderY} angle={-60} tone="fill-brand-anchor" />
        <Wrench x={x - 26} y={shoulderY - 12} angle={-150} />
      </g>
    </Person>
  );
}

function PowerPole({ x }: { x: number }) {
  return (
    <>
      <path d={`M0 30Q${x / 2} 52 ${x - 26} 36M0 46Q${x / 2} 68 ${x + 26} 36`} strokeWidth="2" className="fill-none stroke-brand-primary/30" />
      <rect x={x - 5} y="22" width="10" height={GROUND_Y - 22} rx="3" className="fill-brand-primary/40" />
      <rect x={x - 32} y="32" width="64" height="7" rx="3" className="fill-brand-primary/40" />
      <circle cx={x - 26} cy="30" r="4" className="fill-brand-accent" />
      <circle cx={x + 26} cy="30" r="4" className="fill-brand-accent" />
      <path d={`M${x + 26} 36Q${x + 40} 110 ${x + 36} 166`} strokeWidth="3" className="fill-none stroke-brand-primary/40" />
    </>
  );
}

function CrewKit({ x }: { x: number }) {
  return (
    <>
      <rect x={x} y={GROUND_Y - 40} width="84" height="40" rx="6" className="fill-brand-primary" />
      <rect x={x} y={GROUND_Y - 40} width="84" height="12" rx="6" className="fill-brand-primary/40" />
      <path d={`M${x + 28} ${GROUND_Y - 40}v-10h28v10`} strokeWidth="5" strokeLinejoin="round" className="fill-none stroke-brand-primary/40" />
      <rect x={x + 36} y={GROUND_Y - 32} width="12" height="8" rx="2" className="fill-brand-accent" />
      <path d={`M${x + 102} ${GROUND_Y}l18-70 18 70`} strokeWidth="5" strokeLinecap="round" className="fill-none stroke-brand-primary/40" />
      <rect x={x + 94} y="120" width="52" height="34" rx="5" className="fill-brand-accent" />
      <path d={`M${x + 102} 128l8 18M${x + 114} 128l8 18M${x + 126} 128l8 18`} strokeWidth="4" className="stroke-white/70" />
      <circle cx={x + 120} cy="112" r="6" className="empty-blink fill-brand-accent" />
    </>
  );
}

export function ErrorScene({ width }: { width: number }) {
  const cx = width / 2;
  const isWide = width > SCENE_WIDTH.phone;
  const cableStart = isWide ? cx - 230 : cx - 210;
  return (
    <>
      <rect x="0" y={GROUND_Y} width={width} height="20" className="fill-brand-primary/10" />
      {isWide && <PowerPole x={cx - 300} />}
      {isWide && <CrewKit x={cx + 190} />}

      <rect x={cx + 46} y="66" width="84" height="88" rx="16" className="fill-brand-primary/20" />
      <rect x={cx + 40} y="60" width="84" height="88" rx="16" strokeWidth="2" className="fill-white stroke-brand-primary/30" />
      <rect x={cx + 62} y="92" width="8" height="22" rx="3" className="fill-brand-ink/60" />
      <rect x={cx + 94} y="92" width="8" height="22" rx="3" className="fill-brand-ink/60" />

      <g className="empty-sweep">
        <path d={`M${cableStart} ${GROUND_Y - 14}C${cx - 140} ${GROUND_Y} ${cx - 120} 110 ${cx - 40} 110`} strokeWidth="7" strokeLinecap="round" className="fill-none stroke-brand-primary/60" />
        <rect x={cx - 44} y="92" width="44" height="36" rx="8" className="fill-brand-primary" />
        <rect x={cx - 36} y="100" width="20" height="4" rx="2" className="fill-white/40" />
        <rect x={cx} y="98" width="16" height="6" rx="2" className="fill-brand-ink/60" />
        <rect x={cx} y="116" width="16" height="6" rx="2" className="fill-brand-ink/60" />
      </g>
      {/* The cable's end hides under this box, so it slides in and out as the plug moves. */}
      {isWide && <rect x={cableStart - 52} y={GROUND_Y - 36} width="66" height="38" rx="6" className="fill-brand-primary/40" />}
      <path d={`M${cx + 28} 92l-6 12h8l-6 14`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="empty-blink fill-none stroke-brand-accent" />

      <Fixer x={cx + 172} />
      <Sparkle x={cx - 150} y={50} tone="fill-brand-anchor" />
      <Sparkle x={cx + 20} y={30} tone="fill-brand-accent" delay="-1.4s" />
    </>
  );
}

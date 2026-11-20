// Empty profile tabs, each a full street scene in the home-page style, built around the centre so
// phones keep the main subject and wide screens get the whole street.
// My events: an empty stage waiting for its first host. Registrations: an event on behind a fence,
// you outside the gate. Saved: an empty pinboard, a heart pin hovering over its spot. Alerts: the street
// sleeps, and so does the bell, because nothing has been reported.

import { ResponsiveScene, SCENE_WIDTH, type SceneLayout } from "./ResponsiveScene";
import { Arm, Car, Person, Road, Sparkle, StreetLamp, Tree, type Tone } from "./parts";

const GROUND_Y = 200;

// ---------- My events: empty stage ----------

// Front view of an empty audience seat.
function Chair({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y - 20} width="18" height="15" rx="5" className="fill-brand-primary/40" />
      <rect x={x - 2} y={y - 6} width="22" height="5" rx="2" className="fill-brand-primary/60" />
      <rect x={x + 1} y={y - 1} width="3" height="8" className="fill-brand-primary/30" />
      <rect x={x + 14} y={y - 1} width="3" height="8" className="fill-brand-primary/30" />
    </g>
  );
}

function ChairBlock({ fromX, count }: { fromX: number; count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          <Chair x={fromX + i * 28} y={176} />
          <Chair x={fromX + i * 28 + 10} y={192} />
        </g>
      ))}
    </>
  );
}

function StageScene({ width }: { width: number }) {
  const cx = width / 2;
  const isWide = width > SCENE_WIDTH.phone;
  return (
    <>
      <rect x="0" y={GROUND_Y} width={width} height="20" className="fill-brand-primary/10" />

      <g className="empty-beam" style={{ transformOrigin: `${cx}px 20px`, animationDuration: "6s" }}>
        <polygon points={`${cx - 8},20 ${cx + 8},20 ${cx + 60},146 ${cx - 60},146`} className="fill-brand-accent/15" />
      </g>
      <rect x={cx - 150} y="146" width="300" height="10" rx="3" className="fill-brand-primary" />
      <rect x={cx - 144} y="156" width="288" height={GROUND_Y - 156} className="fill-brand-primary/40" />
      <rect x={cx - 172} y="14" width="40" height="140" rx="6" className="fill-brand-primary" />
      <rect x={cx + 132} y="14" width="40" height="140" rx="6" className="fill-brand-primary" />
      <path d={`M${cx - 160} 24v124M${cx - 146} 24v124M${cx + 146} 24v124M${cx + 160} 24v124`} strokeWidth="2" className="stroke-white/20" />
      <rect x={cx - 180} y="8" width="360" height="18" rx="4" className="fill-brand-primary/80" />

      {/* Mic waiting centre stage, with a pulsing "+" beside it: host the first one. */}
      <rect x={cx - 1.5} y="104" width="3" height="42" className="fill-brand-ink/70" />
      <rect x={cx - 12} y="143" width="24" height="4" rx="2" className="fill-brand-ink/70" />
      <rect x={cx - 5} y="92" width="10" height="16" rx="5" className="fill-brand-ink/80" />
      <circle cx={cx + 70} cy="124" r="14" className="empty-pulse fill-brand-accent" />
      <path d={`M${cx + 70} 117v14M${cx + 63} 124h14`} strokeWidth="3" strokeLinecap="round" className="stroke-white" />

      {isWide ? (
        <>
          <ChairBlock fromX={cx - 380} count={6} />
          <ChairBlock fromX={cx + 200} count={6} />
          <Sparkle x={cx - 260} y={40} tone="fill-brand-anchor" />
          <Sparkle x={cx + 250} y={60} tone="fill-brand-accent" delay="-1.8s" />
        </>
      ) : (
        <>
          <ChairBlock fromX={cx - 206} count={1} />
          <ChairBlock fromX={cx + 176} count={1} />
        </>
      )}
    </>
  );
}

// ---------- Registrations: they're inside, you're outside ----------

const CROWD_TONES: Tone[] = ["fill-brand-primary", "fill-brand-accent", "fill-brand-anchor"];
const FENCE_TOP = 150;

function Reveller({ x, index }: { x: number; index: number }) {
  const tone = CROWD_TONES[index % 3];
  const feetY = FENCE_TOP + 14;
  return (
    <g className="empty-bounce" style={{ animationDelay: `${-index * 0.23}s` }}>
      <Person x={x} feetY={feetY} tone={tone}>
        {index % 2 === 0 && (
          <>
            <Arm fromX={x - 6} fromY={feetY - 34} angle={-28} tone={tone} />
            <Arm fromX={x + 6} fromY={feetY - 34} angle={28} tone={tone} />
          </>
        )}
      </Person>
    </g>
  );
}

// Fence runs from just right of the gate to the card edge; the left side is the open street outside.
function Fence({ width, gateX }: { width: number; gateX: number }) {
  const start = gateX + 46;
  const posts = [];
  for (let x = start + 10; x < width; x += 22) posts.push(x);
  return (
    <>
      <rect x={start} y={FENCE_TOP + 10} width={width - start} height="6" className="fill-brand-primary/40" />
      <rect x={start} y={FENCE_TOP + 34} width={width - start} height="6" className="fill-brand-primary/40" />
      {posts.map((x) => (
        <rect key={x} x={x} y={FENCE_TOP} width="8" height={GROUND_Y - FENCE_TOP} rx="3" className="fill-brand-primary/40" />
      ))}
      {/* Gate arch with a sign: the way in is right there. */}
      <rect x={gateX - 46} y="96" width="10" height={GROUND_Y - 96} rx="3" className="fill-brand-primary" />
      <rect x={gateX + 36} y="96" width="10" height={GROUND_Y - 96} rx="3" className="fill-brand-primary" />
      <rect x={gateX - 52} y="90" width="104" height="22" rx="6" className="fill-brand-primary" />
      <rect x={gateX - 30} y="97" width="60" height="8" rx="4" className="fill-white/80" />
    </>
  );
}

function GateScene({ width }: { width: number }) {
  const cx = width / 2;
  const isWide = width > SCENE_WIDTH.phone;
  const gateX = cx - 40;
  const stageX = isWide ? cx + 170 : cx + 110;
  const crowd: number[] = [];
  for (let x = gateX + 70; x <= width + 10; x += 46) crowd.push(x);
  return (
    <>
      <rect x="0" y={GROUND_Y} width={width} height="20" className="fill-brand-primary/10" />
      {/* Inside: stage glow and bunting, the event is on. */}
      <rect x={stageX - 90} y="34" width="180" height="64" rx="8" className="fill-brand-primary/20" />
      <rect x={stageX - 76} y="44" width="152" height="44" rx="6" className="empty-pulse fill-brand-accent/40" />
      <path d={`M${gateX} 18Q${(gateX + width) / 2} 40 ${width} 18`} strokeWidth="1.5" className="fill-none stroke-brand-ink/30" />
      {Array.from({ length: Math.floor((width - gateX) / 40) }, (_, i) => {
        const x = gateX + 20 + i * 40;
        const t = (x - gateX) / (width - gateX);
        const y = 18 + 4 * t * (1 - t) * 22;
        return <polygon key={x} points={`${x - 7},${y} ${x + 7},${y} ${x},${y + 13}`} className={`empty-sway ${i % 2 ? "fill-brand-accent" : "fill-brand-primary"}`} />;
      })}
      {crowd.map((x, i) => (
        <Reveller key={x} x={x} index={i} />
      ))}
      <Fence width={width} gateX={gateX} />

      {/* Outside: you, on the open street, looking in at the gate. */}
      {isWide && (
        <>
          <Tree x={cx - 330} groundY={GROUND_Y} size={20} />
          <StreetLamp x={cx - 250} groundY={GROUND_Y} />
          <Sparkle x={cx - 300} y={50} tone="fill-brand-anchor" />
        </>
      )}
      <ellipse cx={gateX - 96} cy={GROUND_Y + 2} rx="18" ry="4" className="fill-brand-primary/20" />
      <Person x={gateX - 96} feetY={GROUND_Y} tone="fill-brand-anchor" />
    </>
  );
}

// ---------- Saved: empty pinboard ----------

function PinboardScene({ width }: { width: number }) {
  const cx = width / 2;
  const isWide = width > SCENE_WIDTH.phone;
  const left = cx - (isWide ? 300 : 196);
  const right = cx + (isWide ? 236 : 120);
  const slots: [number, number][] = [];
  const columns = Math.floor((right - left - 24) / 78);
  const firstX = left + (right - left - (columns * 78 - 18)) / 2;
  for (let col = 0; col < columns; col++) {
    slots.push([firstX + col * 78, 34], [firstX + col * 78, 100]);
  }
  const target = slots[Math.floor(slots.length / 2)];
  return (
    <>
      <rect x="0" y={GROUND_Y} width={width} height="20" className="fill-brand-primary/10" />
      <rect x={left} y="16" width={right - left} height="152" rx="10" className="fill-brand-accent/15 stroke-brand-primary/40" strokeWidth="6" />
      {slots.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="60" height="48" rx="5" strokeDasharray="5 4" strokeWidth="2" className="fill-white/50 stroke-brand-primary/30" />
          <circle cx={x + 30} cy={y} r="4" className="fill-brand-primary/30" />
        </g>
      ))}
      <rect x={left + 40} y="168" width="8" height={GROUND_Y - 168} className="fill-brand-primary/40" />
      <rect x={right - 48} y="168" width="8" height={GROUND_Y - 168} className="fill-brand-primary/40" />

      {/* A heart pin hovers over its spot but never lands: nothing saved yet. */}
      <rect x={target[0]} y={target[1]} width="60" height="48" rx="5" className="empty-pulse fill-brand-accent/20" />
      <g className="empty-float">
        <path d={`M${target[0] + 30} ${target[1] + 12}s-14-9-14-18a8 8 0 0 1 14-4 8 8 0 0 1 14 4c0 9-14 18-14 18z`} className="fill-brand-accent" />
        <rect x={target[0] + 29} y={target[1] + 12} width="2" height="10" className="fill-brand-ink/50" />
      </g>

      {/* Someone beside the board, a pin ready in hand. */}
      <Person x={right + 44} feetY={GROUND_Y} tone="fill-brand-primary">
        <Arm fromX={right + 38} fromY={GROUND_Y - 34} angle={-40} tone="fill-brand-primary" />
      </Person>
      <path d={`M${right + 22} 140s-8-5-8-10a4.5 4.5 0 0 1 8-2.5 4.5 4.5 0 0 1 8 2.5c0 5-8 10-8 10z`} className="fill-brand-accent" />
      {isWide && <Sparkle x={left - 40} y={60} tone="fill-brand-anchor" />}
    </>
  );
}

// ---------- Alerts: the street sleeps ----------

const SNORES = [
  { dx: 40, dy: 80, size: 1, delay: "0s" },
  { dx: 58, dy: 56, size: 1.3, delay: "-1s" },
  { dx: 80, dy: 28, size: 1.6, delay: "-2s" },
];

function SleepScene({ width }: { width: number }) {
  const cx = width / 2;
  const isWide = width > SCENE_WIDTH.phone;
  const poleX = cx - 70;
  return (
    <>
      <circle cx={cx + 150} cy="34" r="18" className="empty-pulse fill-brand-accent/60" />
      <Sparkle x={cx - 200} y={24} tone="fill-brand-anchor/70" />
      <Sparkle x={cx + 240} y={60} tone="fill-brand-anchor/70" delay="-1.6s" />
      <Road width={width} groundY={GROUND_Y} />
      {isWide && (
        <>
          <Car x={cx - 260} groundY={GROUND_Y} />
          <Car x={cx + 200} groundY={GROUND_Y} tone="fill-brand-accent" />
        </>
      )}

      {/* The bell hangs from its bracket, rocking slowly in its sleep. */}
      <rect x={poleX - 3} y="20" width="6" height={GROUND_Y - 20} className="fill-brand-primary/40" />
      <rect x={poleX} y="20" width="74" height="6" rx="3" className="fill-brand-primary/40" />
      <g transform={`translate(${cx} 26) scale(0.62)`}>
        <g className="empty-rock">
          <circle cx="0" cy="10" r="9" className="fill-brand-deep" />
          <path d="M-62 140Q-50 128 -50 110V80a50 50 0 0 1 100 0V110Q50 128 62 140Z" className="fill-brand-primary" />
          <rect x="-68" y="136" width="136" height="14" rx="7" className="fill-brand-deep" />
          <circle cx="0" cy="160" r="11" className="fill-brand-accent" />
        </g>
      </g>
      {SNORES.map(({ dx, dy, size, delay }) => (
        <g key={dx} className="empty-zzz" style={{ animationDelay: delay }}>
          <path d={`M${cx + dx} ${dy}h${10 * size}l${-10 * size} ${12 * size}h${10 * size}`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="fill-none stroke-brand-primary/60" />
        </g>
      ))}
    </>
  );
}

const SCENES = {
  posted: StageScene,
  registered: GateScene,
  saved: PinboardScene,
  alerts: SleepScene,
};

export type ProfileEmptyScene = keyof typeof SCENES;

export function ProfileIllustration({ scene }: { scene: ProfileEmptyScene }) {
  const Scene = SCENES[scene];
  return <ResponsiveScene render={(layout: SceneLayout) => <Scene width={SCENE_WIDTH[layout]} />} />;
}

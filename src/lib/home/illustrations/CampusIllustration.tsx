// Two campus scenes. Each has its own phone layout instead of a centre crop of the desktop one,
// because cropping a split scene cut off half of each side (and the lecturer) on small screens.
// "For my batch": split view, other batches at an event through the window, your batch in a lecture.
// "All campus": nobody is hosting anything because it is exam season; the whole hall is heads down writing.

import { ResponsiveScene } from "./ResponsiveScene";

const FLOOR_Y = 200;

type Tone = "fill-brand-primary" | "fill-brand-anchor" | "fill-brand-accent" | "fill-brand-deep";
const TONES: Tone[] = ["fill-brand-primary", "fill-brand-anchor", "fill-brand-deep", "fill-brand-accent"];

// Drawn from behind: hair, shoulders. No faces, so the scene stays "warm but not cute".
function SeatedStudent({ x, y, tone, className, delay }: { x: number; y: number; tone: Tone; className?: string; delay?: string }) {
  return (
    <g className={className} style={delay ? { animationDelay: delay } : undefined}>
      <path d={`M${x - 18} ${y + 34}q0-20 18-20t18 20z`} className={tone} />
      <circle cx={x} cy={y} r="11" className="fill-brand-ink/80" />
    </g>
  );
}

// ---------- Scene A: event outside, lecture inside ----------

const BATCH_LAYOUTS = {
  wide: {
    width: 800,
    window: { x: 16, y: -8, width: 368, height: 196 },
    wallX: 400,
    board: { x: 440, width: 250 },
    lecturerX: 742,
    classRow: [452, 522, 592, 662, 732],
    party: [70, 120, 172, 228, 282, 334],
  },
  phone: {
    width: 420,
    window: { x: 8, y: -8, width: 192, height: 196 },
    wallX: 212,
    board: { x: 228, width: 130 },
    lecturerX: 392,
    classRow: [244, 300, 356],
    party: [40, 84, 128, 172],
  },
};
type BatchLayout = (typeof BATCH_LAYOUTS)["wide"];

function PartyPerson({ x, feetY, tone, delay }: { x: number; feetY: number; tone: Tone; delay: string }) {
  return (
    <g className="empty-bounce" style={{ animationDelay: delay }}>
      <rect x={x - 9} y={feetY - 40} width="18" height="40" rx="9" className={tone} />
      <circle cx={x} cy={feetY - 50} r="10" className="fill-brand-ink/80" />
      <rect x={x - 19} y={feetY - 62} width="6" height="24" rx="3" transform={`rotate(-28 ${x - 16} ${feetY - 38})`} className={tone} />
      <rect x={x + 13} y={feetY - 62} width="6" height="24" rx="3" transform={`rotate(28 ${x + 16} ${feetY - 38})`} className={tone} />
    </g>
  );
}

function PartyOutside({ layout, clipId }: { layout: BatchLayout; clipId: string }) {
  const { x, y, width, height } = layout.window;
  const groundY = y + height - 14;
  const flags = Math.floor((width - 16) / 34) + 1;
  return (
    <g clipPath={`url(#${clipId})`}>
      <rect x={x} y={y} width={width} height={height} className="fill-brand-anchor/15" />
      <circle cx={x + width - 60} cy={y + 34} r="18" className="empty-pulse fill-brand-accent/60" />
      {/* Event stage in the distance */}
      <rect x={x + width * 0.3} y={groundY - 96} width={width * 0.4} height="56" rx="6" className="fill-brand-primary/30" />
      <rect x={x + width * 0.3 + 10} y={groundY - 88} width={width * 0.4 - 20} height="30" rx="4" className="empty-pulse fill-brand-accent/40" />
      <path d={`M${x} ${y + 26}Q${x + width / 2} ${y + 62} ${x + width} ${y + 26}`} strokeWidth="1.5" className="fill-none stroke-brand-ink/30" />
      {Array.from({ length: flags }, (_, i) => {
        const bx = x + 16 + i * 34;
        const t = (bx - x) / width;
        const by = y + 26 + 4 * 36 * t * (1 - t);
        return (
          <polygon
            key={bx}
            points={`${bx - 8},${by} ${bx + 8},${by} ${bx},${by + 14}`}
            className={`empty-sway ${i % 2 ? "fill-brand-accent" : "fill-brand-primary"}`}
            style={{ animationDelay: `${-(i % 4) * 0.4}s` }}
          />
        );
      })}
      <rect x={x} y={groundY} width={width} height="14" className="fill-brand-primary/20" />
      {/* Everyone outside is jumping: the event your batch is missing. */}
      {layout.party.map((px, i) => (
        <PartyPerson key={px} x={px} feetY={groundY} tone={TONES[(i + 3) % TONES.length]} delay={`${-i * 0.37}s`} />
      ))}
      <path d={`M${x + 34} ${y + 70}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} className="empty-twinkle fill-brand-accent" />
      <path d={`M${x + width - 40} ${y + 84}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} className="empty-twinkle fill-brand-primary" style={{ animationDelay: "-1.5s" }} />
    </g>
  );
}

function BatchScene({ layout, clipId }: { layout: BatchLayout; clipId: string }) {
  const { x, y, width, height } = layout.window;
  const { board, lecturerX, classRow, wallX } = layout;
  const lastSeat = classRow[classRow.length - 1];
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx="8" />
        </clipPath>
      </defs>
      <rect x="0" y="-20" width={layout.width} height="240" className="fill-brand-primary/5" />

      <rect x={x - 8} y={y - 8} width={width + 16} height={height + 16} rx="12" className="fill-brand-primary/30" />
      <PartyOutside layout={layout} clipId={clipId} />
      <rect x={x + width / 2 - 3} y={y} width="6" height={height} className="fill-brand-primary/30" />

      {/* The wall between the two worlds */}
      <rect x={wallX - 6} y="-20" width="12" height="240" className="fill-brand-primary/40" />

      {/* Lecture still going */}
      <rect x={board.x} y="4" width={board.width} height="96" rx="6" className="fill-brand-ink/85" />
      <rect x={board.x} y="96" width={board.width} height="6" rx="3" className="fill-brand-primary/40" />
      <path d={`M${board.x + 18} 30h${board.width * 0.4}M${board.x + 18} 50h${board.width * 0.55}M${board.x + 18} 70h${board.width * 0.3}`} strokeWidth="3" strokeLinecap="round" className="stroke-white/50" />
      <circle cx={board.x + board.width - 40} cy="56" r="18" strokeWidth="3" className="fill-none stroke-brand-accent/70" />
      <rect x={lecturerX - 14} y="56" width="28" height="68" rx="11" className="fill-brand-deep" />
      <circle cx={lecturerX} cy="42" r="12" className="fill-brand-ink/80" />
      <rect x={lecturerX - 20} y="62" width="5" height="44" rx="2.5" className="empty-sway fill-brand-accent" />

      {classRow.map((sx, i) => (
        <SeatedStudent key={sx} x={sx} y={140} tone={TONES[i % 3]} className={i % 2 ? "empty-float" : undefined} delay={`${-i * 0.7}s`} />
      ))}
      <rect x={wallX + 16} y="172" width={lastSeat - wallX + 22} height="10" rx="4" className="fill-brand-primary/40" />
      {classRow.map((sx) => (
        <rect key={sx} x={sx - 3} y="182" width="6" height={FLOOR_Y - 182 + 20} className="fill-brand-primary/30" />
      ))}
    </>
  );
}

export function CampusEligibleIllustration() {
  return <ResponsiveScene render={(layout) => <BatchScene layout={BATCH_LAYOUTS[layout]} clipId={`campus-window-${layout}`} />} />;
}

// ---------- Scene C: exam season ----------

const EXAM_LAYOUTS = {
  wide: { width: 800, centerX: 400, clockX: 700, wander: "empty-wander", backRow: [130, 230, 330, 470, 570, 670], frontRow: [70, 190, 310, 490, 610, 730] },
  phone: { width: 420, centerX: 210, clockX: 370, wander: "empty-wander-sm", backRow: [60, 140, 280, 360], frontRow: [40, 130, 290, 380] },
};
type ExamLayout = (typeof EXAM_LAYOUTS)["wide"];

function ExamDesk({ x, y, tone, delay }: { x: number; y: number; tone: Tone; delay: string }) {
  return (
    <g>
      <SeatedStudent x={x} y={y} tone={tone} />
      <rect x={x - 30} y={y + 30} width="60" height="8" rx="3" className="fill-brand-primary/40" />
      <rect x={x - 12} y={y + 25} width="24" height="6" rx="1" className="fill-white" />
      {/* Pen hand moving: everyone is busy writing. */}
      <rect x={x + 2} y={y + 20} width="3" height="11" rx="1.5" transform={`rotate(25 ${x + 3} ${y + 31})`} className="empty-write fill-brand-ink" style={{ animationDelay: delay }} />
    </g>
  );
}

function ExamScene({ layout }: { layout: ExamLayout }) {
  const { width, centerX, clockX, wander, backRow, frontRow } = layout;
  return (
    <>
      <rect x="0" y="-20" width={width} height="240" className="fill-brand-primary/5" />

      {/* Wall clock: exam time is ticking away. */}
      <circle cx={clockX} cy="24" r="26" className="fill-brand-primary" />
      <circle cx={clockX} cy="24" r="21" className="fill-white" />
      <rect x={clockX - 1} y="11" width="2" height="14" rx="1" className="fill-brand-ink" />
      <rect x={clockX - 1} y="6" width="2" height="19" rx="1" className="empty-spin fill-brand-accent" style={{ transformOrigin: `${clockX}px 24px` }} />

      {/* Invigilator pacing behind the rows */}
      <g className={wander}>
        <rect x={centerX - 12} y="44" width="24" height="54" rx="10" className="fill-brand-deep" />
        <circle cx={centerX} cy="34" r="10" className="fill-brand-ink/80" />
      </g>

      {backRow.map((x, i) => (
        <ExamDesk key={x} x={x} y={108} tone={i % 2 ? "fill-brand-anchor" : "fill-brand-primary"} delay={`${-i * 0.3}s`} />
      ))}
      {frontRow.map((x, i) => (
        <ExamDesk key={x} x={x} y={160} tone={i % 2 ? "fill-brand-primary" : "fill-brand-deep"} delay={`${-i * 0.45}s`} />
      ))}
      <rect x="0" y={FLOOR_Y + 8} width={width} height="12" className="fill-brand-primary/10" />
    </>
  );
}

export function CampusAllIllustration() {
  return <ResponsiveScene render={(layout) => <ExamScene layout={EXAM_LAYOUTS[layout]} />} />;
}

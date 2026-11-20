// For You is the feed picked from the user's interests, drawn as an event street fair:
// every stall is a category, but the ones you follow have their shutters down.
// A shutter peeks open now and then (we keep checking), and the heart balloon (your interests)
// drifts along the row looking for a match. Same wide, cropped canvas as Around You.

const GROUND_Y = 200;
const STALL_WIDTH = 96;
const STALL_TOP = 92;
const STRIPES = 6;

export type Glyph = "music" | "ball" | "mic" | "star";

// Centres spread from the middle out, so a phone's crop still shows three full stalls.
const STALLS: { cx: number; glyph: Glyph; tone: string; delay: string }[] = [
  { cx: 400, glyph: "star", tone: "fill-brand-accent", delay: "0s" },
  { cx: 280, glyph: "music", tone: "fill-brand-primary", delay: "-2.5s" },
  { cx: 520, glyph: "ball", tone: "fill-brand-anchor", delay: "-5s" },
  { cx: 160, glyph: "mic", tone: "fill-brand-anchor", delay: "-7.5s" },
  { cx: 640, glyph: "music", tone: "fill-brand-primary", delay: "-1.2s" },
  { cx: 40, glyph: "ball", tone: "fill-brand-accent", delay: "-3.8s" },
  { cx: 760, glyph: "mic", tone: "fill-brand-accent", delay: "-6.3s" },
];

const BUNTING_COLORS = ["fill-brand-primary", "fill-brand-accent", "fill-brand-anchor", "fill-brand-primary/40"];

export function SignGlyph({ glyph }: { glyph: Glyph }) {
  if (glyph === "music") {
    return (
      <g className="fill-white">
        <rect x="1" y="-8" width="2.5" height="11" rx="1.25" />
        <rect x="1" y="-8" width="7" height="2.5" rx="1.25" />
        <circle cx="-0.5" cy="3.5" r="3" />
      </g>
    );
  }
  if (glyph === "ball") {
    return (
      <g>
        <circle r="6.5" className="fill-white" />
        <rect x="-6.5" y="-1" width="13" height="2" className="fill-brand-ink/30" />
      </g>
    );
  }
  if (glyph === "mic") {
    return (
      <g className="fill-white">
        <rect x="-3" y="-8" width="6" height="10" rx="3" />
        <rect x="-0.75" y="2" width="1.5" height="5" />
      </g>
    );
  }
  return <polygon className="fill-white" points="0,-8 2.4,-2.6 8,-2.4 3.6,1.2 5,7 0,3.8 -5,7 -3.6,1.2 -8,-2.4 -2.4,-2.6" />;
}

function Stall({ cx, glyph, tone, delay }: (typeof STALLS)[number]) {
  const left = cx - STALL_WIDTH / 2;
  const stripeWidth = STALL_WIDTH / STRIPES;
  return (
    <g>
      <rect x={left + 4} y={STALL_TOP} width="5" height={GROUND_Y - STALL_TOP} className="fill-brand-primary/40" />
      <rect x={left + STALL_WIDTH - 9} y={STALL_TOP} width="5" height={GROUND_Y - STALL_TOP} className="fill-brand-primary/40" />
      <rect x={left + 6} y={STALL_TOP + 26} width={STALL_WIDTH - 12} height={GROUND_Y - STALL_TOP - 26} className="fill-brand-primary/10" />
      {/* Shutter: down means no event here for you; it lifts a little when we re-check. */}
      <rect
        x={left + 9}
        y={STALL_TOP + 26}
        width={STALL_WIDTH - 18}
        height="58"
        className="empty-peek fill-brand-primary/25"
        style={{ animationDelay: delay }}
      />
      <rect x={left + 6} y={GROUND_Y - 22} width={STALL_WIDTH - 12} height="22" rx="2" className="fill-brand-primary/30" />
      {Array.from({ length: STRIPES }, (_, i) => (
        <g key={i}>
          <rect x={left + i * stripeWidth} y={STALL_TOP + 6} width={stripeWidth} height="16" className={i % 2 ? "fill-white" : tone} />
          <circle cx={left + i * stripeWidth + stripeWidth / 2} cy={STALL_TOP + 22} r={stripeWidth / 2} className={i % 2 ? "fill-white" : tone} />
        </g>
      ))}
      <g transform={`translate(${cx} ${STALL_TOP - 12})`}>
        <circle r="13" className={tone} />
        <SignGlyph glyph={glyph} />
      </g>
    </g>
  );
}

export function ForYouIllustration() {
  return (
    <svg viewBox="0 -20 800 240" preserveAspectRatio="xMidYMax slice" className="h-full w-full" aria-hidden="true" focusable="false">
      <path d="M-20 26 Q400 76 820 26" className="fill-none stroke-brand-primary/30" strokeWidth="2" />
      {Array.from({ length: 21 }, (_, i) => {
        const x = -10 + i * 41;
        const t = (x + 20) / 840;
        const y = 26 + 4 * 50 * t * (1 - t);
        return (
          <polygon
            key={x}
            points={`${x - 9},${y} ${x + 9},${y} ${x},${y + 16}`}
            className={`empty-sway ${BUNTING_COLORS[i % BUNTING_COLORS.length]}`}
            style={{ animationDelay: `${-(i % 5) * 0.4}s` }}
          />
        );
      })}

      <rect x="0" y={GROUND_Y} width="800" height="20" className="fill-brand-primary/10" />
      {STALLS.map((stall) => (
        <Stall key={stall.cx} {...stall} />
      ))}

      {/* Heart balloon: the user's interests, wandering the fair. */}
      <g className="empty-wander" transform="translate(0 -36)">
        <g className="empty-float">
          <path d="M400 92 q-6 14 0 26" className="fill-none stroke-brand-ink/40" strokeWidth="1.5" />
          <path
            d="M400 92s-18-11-18-24a10 10 0 0 1 18-6 10 10 0 0 1 18 6c0 13-18 24-18 24z"
            className="fill-brand-accent"
          />
          <ellipse cx="392" cy="68" rx="3" ry="5" className="fill-white/50" />
        </g>
      </g>
    </svg>
  );
}

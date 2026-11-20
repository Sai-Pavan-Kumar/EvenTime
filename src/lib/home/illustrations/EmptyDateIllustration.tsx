// Shown when a picked date has no events. The calendar carries the real date the user chose,
// so the scene answers "what did I ask for?" before the text does.
// Loop story: a sheet flips away, the magnifier sweeps the empty slots, the amber zero pops. Nothing found.

const EVENT_SLOTS = [
  { y: 100, width: 68, delay: "0s" },
  { y: 112, width: 48, delay: "-0.4s" },
  { y: 124, width: 58, delay: "-0.8s" },
];

function formatCalendarParts(isoDate: string) {
  // UTC keeps "2026-11-29" on the 29th whatever the viewer's timezone is.
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  return {
    day: parsed.getUTCDate(),
    month: parsed.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
  };
}

export function EmptyDateIllustration({ date }: { date: string }) {
  const { day, month } = formatCalendarParts(date);

  return (
    <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="146" rx="80" ry="6" className="fill-brand-primary/10" />

      <g className="empty-float" style={{ animationDuration: "6s" }}>
        <rect x="75" y="33" width="100" height="108" rx="12" className="fill-brand-primary/20" />
        <rect x="70" y="28" width="100" height="108" rx="12" className="fill-surface-base" />
        <rect x="70" y="28" width="100" height="30" rx="12" className="fill-brand-primary" />
        <rect x="70" y="46" width="100" height="12" className="fill-brand-primary" />
        <rect x="92" y="20" width="6" height="16" rx="3" className="fill-brand-deep" />
        <rect x="142" y="20" width="6" height="16" rx="3" className="fill-brand-deep" />
        <text x="120" y="48" textAnchor="middle" className="fill-white font-heading" fontSize="11" fontWeight="700" letterSpacing="2">
          {month}
        </text>
        <text x="120" y="90" textAnchor="middle" className="fill-brand-ink font-heading" fontSize="30" fontWeight="800">
          {day}
        </text>

        {EVENT_SLOTS.map(({ y, width, delay }) => (
          <rect key={y} x="86" y={y} width={width} height="6" rx="3" className="empty-pulse fill-brand-primary/20" style={{ animationDelay: delay }} />
        ))}

        {/* The previous day's sheet tearing away; it fades back in at the end of each loop. */}
        <rect x="70" y="58" width="100" height="78" rx="4" className="empty-flip fill-brand-soft" />

        <g className="empty-pop">
          <circle cx="168" cy="32" r="11" className="fill-brand-accent" />
          <text x="168" y="36.5" textAnchor="middle" className="fill-white font-heading" fontSize="13" fontWeight="800">0</text>
        </g>
      </g>

      <g className="empty-sweep">
        <rect x="146" y="124" width="5" height="16" rx="2.5" transform="rotate(-40 148 132)" className="fill-brand-anchor" />
        <circle cx="140" cy="116" r="11" className="fill-brand-anchor" />
        <circle cx="140" cy="116" r="7" className="fill-white/85" />
      </g>

      <path d="M44 46l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" className="empty-twinkle fill-brand-anchor" />
      <path d="M198 92l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" className="empty-twinkle fill-brand-accent" style={{ animationDelay: "-1.8s" }} />
      <circle cx="50" cy="112" r="5" className="empty-float fill-brand-primary/30" style={{ animationDelay: "-2s" }} />
      <circle cx="196" cy="58" r="4" className="empty-float fill-brand-anchor/40" style={{ animationDelay: "-3s" }} />
    </svg>
  );
}

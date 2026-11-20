// Around You is about the user's own city, so the scene echoes the greeting banner's skyline:
// a pin drops onto town, sends out a search ripple, and the ripple comes back empty.
// Traffic keeps moving so the city still feels alive even though nothing is on.
// Drawn wide (800x240 incl. sky headroom) and cropped with "slice": phones see the pin and nearby blocks, desktops the whole street.

const GROUND_Y = 200;
const CENTER_X = 400;

// [x, width, height]; the gap around the centre keeps the pin readable against open sky.
const BUILDINGS: [number, number, number][] = [
  [-10, 46, 70], [40, 30, 112], [74, 52, 84], [130, 34, 132], [168, 48, 64], [220, 28, 100], [252, 44, 76], [300, 30, 120],
  [470, 30, 108], [504, 46, 72], [554, 30, 140], [588, 50, 88], [642, 32, 116], [678, 46, 70], [728, 30, 124], [762, 48, 82],
];

function buildingWindows(x: number, width: number, height: number) {
  const windows: { x: number; y: number; delay: string }[] = [];
  for (let row = GROUND_Y - height + 12; row < GROUND_Y - 16; row += 18) {
    for (let col = x + 7; col < x + width - 10; col += 13) {
      // Deterministic "random" pick so server and client render the same lit windows.
      if ((col * 7 + row * 3) % 5 < 2) windows.push({ x: col, y: row, delay: `${-((col + row) % 40) / 10}s` });
    }
  }
  return windows;
}

export function AroundYouIllustration() {
  return (
    <svg viewBox="0 -20 800 240" preserveAspectRatio="xMidYMax slice" className="h-full w-full" aria-hidden="true" focusable="false">
      <circle cx="610" cy="54" r="20" className="empty-pulse fill-brand-accent/60" />
      <rect x="150" y="40" width="70" height="16" rx="8" className="empty-drift fill-brand-primary/10" />
      <rect x="470" y="70" width="52" height="13" rx="6.5" className="empty-drift fill-brand-primary/10" style={{ animationDelay: "-4s" }} />
      <rect x="300" y="28" width="44" height="11" rx="5.5" className="empty-drift fill-brand-primary/10" style={{ animationDelay: "-2s" }} />

      {BUILDINGS.map(([x, width, height], index) => (
        <g key={x}>
          <rect x={x} y={GROUND_Y - height} width={width} height={height} rx="3" className={index % 2 ? "fill-brand-primary/30" : "fill-brand-primary/20"} />
          {buildingWindows(x, width, height).map((win) => (
            <rect key={`${win.x}-${win.y}`} x={win.x} y={win.y} width="6" height="6" rx="1" className="empty-pulse fill-white/80" style={{ animationDelay: win.delay }} />
          ))}
        </g>
      ))}

      <rect x="0" y={GROUND_Y} width="800" height="20" className="fill-brand-primary/10" />
      <rect x="0" y={GROUND_Y + 9} width="800" height="2" className="fill-white/70" />

      {/* The search ripple: two rings leave the pin's landing spot and fade with nothing caught. */}
      <ellipse cx={CENTER_X} cy={GROUND_Y} rx="220" ry="22" className="empty-ripple fill-brand-primary/15" />
      <ellipse cx={CENTER_X} cy={GROUND_Y} rx="220" ry="22" className="empty-ripple fill-brand-primary/15" style={{ animationDelay: "-1.4s" }} />

      <ellipse cx={CENTER_X} cy={GROUND_Y} rx="16" ry="4" className="empty-shadow fill-brand-primary/30" />
      <g className="empty-bounce">
        <path
          d="M400 92c-21 0-37 16-37 36 0 26 37 66 37 66s37-40 37-66c0-20-16-36-37-36z"
          className="fill-brand-primary"
        />
        <circle cx={CENTER_X} cy="128" r="14" className="fill-white" />
        <circle cx={CENTER_X} cy="128" r="6" className="fill-brand-accent" />
      </g>

      <g className="empty-drive">
        <rect x="0" y={GROUND_Y - 14} width="34" height="11" rx="4" className="fill-brand-anchor" />
        <rect x="8" y={GROUND_Y - 21} width="17" height="8" rx="3" className="fill-brand-anchor" />
        <circle cx="8" cy={GROUND_Y - 2} r="4" className="fill-brand-ink" />
        <circle cx="26" cy={GROUND_Y - 2} r="4" className="fill-brand-ink" />
      </g>
      <g className="empty-drive-back">
        <rect x="0" y={GROUND_Y + 5} width="30" height="10" rx="4" className="fill-brand-accent" />
        <circle cx="7" cy={GROUND_Y + 16} r="3.5" className="fill-brand-ink" />
        <circle cx="23" cy={GROUND_Y + 16} r="3.5" className="fill-brand-ink" />
      </g>
    </svg>
  );
}

// Scenes for search, cities, 404 and the error page. Idle search lives here; the larger scenes have
// their own files. All draw from ./parts so they match the home page street.

import { ResponsiveScene, SCENE_WIDTH } from "./ResponsiveScene";
import { SignGlyph, type Glyph } from "./ForYouIllustration";
import { Sparkle } from "./parts";
import { NoResultsScene } from "./NoResultsScene";
import { QuietCityScene } from "./QuietCityScene";
import { DeadEndScene } from "./DeadEndScene";
import { ErrorScene } from "./ErrorScene";

// ---------- Idle search (before typing) ----------

const TOPIC_BUBBLES: { dx: number; y: number; glyph: Glyph; tone: string; delay: string }[] = [
  { dx: -160, y: 40, glyph: "music", tone: "fill-brand-primary", delay: "0s" },
  { dx: 160, y: 46, glyph: "mic", tone: "fill-brand-anchor", delay: "-1.2s" },
  { dx: -120, y: 180, glyph: "ball", tone: "fill-brand-accent", delay: "-2.4s" },
  { dx: 130, y: 176, glyph: "star", tone: "fill-brand-primary", delay: "-3.6s" },
];

function SearchIdleScene({ width }: { width: number }) {
  const cx = width / 2;
  return (
    <>
      {TOPIC_BUBBLES.map(({ dx, y, glyph, tone, delay }) => (
        <g key={dx} className="empty-float" style={{ animationDelay: delay }}>
          <g transform={`translate(${cx + dx} ${y})`}>
            <circle r="20" className={tone} />
            <SignGlyph glyph={glyph} />
          </g>
        </g>
      ))}

      <rect x={cx - 146} y="100" width="300" height="48" rx="24" className="fill-brand-primary/15" />
      <rect x={cx - 150} y="94" width="300" height="48" rx="24" strokeWidth="2" className="fill-white stroke-brand-primary/30" />
      <circle cx={cx - 118} cy="116" r="9" strokeWidth="3" className="fill-none stroke-brand-primary" />
      <rect x={cx - 112} y="122" width="4" height="11" rx="2" transform={`rotate(-45 ${cx - 110} 127)`} className="fill-brand-primary" />
      {/* Blinking caret: the bar is waiting for the first letter. */}
      <rect x={cx - 92} y="106" width="3" height="24" rx="1.5" className="empty-blink fill-brand-primary" />
      <rect x={cx - 80} y="114" width="110" height="8" rx="4" className="fill-brand-primary/10" />
      <Sparkle x={cx + 60} y={70} tone="fill-brand-accent" />
    </>
  );
}

const SCENES = {
  "no-results": NoResultsScene,
  "search-idle": SearchIdleScene,
  "quiet-city": QuietCityScene,
  "not-found": DeadEndScene,
  error: ErrorScene,
};

export function SearchIllustration({ scene }: { scene: keyof typeof SCENES }) {
  const Scene = SCENES[scene];
  return <ResponsiveScene render={(layout) => <Scene width={SCENE_WIDTH[layout]} />} />;
}

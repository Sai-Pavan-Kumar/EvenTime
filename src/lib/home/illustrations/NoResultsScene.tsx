// Search with no results: a street notice wall where event posters usually go, every one blank.
// Someone walks along it with a torch, the beam sweeps the wall, and a "?" pops up: nothing matched.

import { SCENE_WIDTH } from "./ResponsiveScene";
import { Arm, Car, Person, Road, StreetLamp } from "./parts";

const GROUND_Y = 200;
const WALL_TOP = 60;
const WALL_BOTTOM = 186;

function BlankPoster({ x, delay }: { x: number; delay: string }) {
  return (
    <g className="empty-pulse" style={{ animationDelay: delay }}>
      <rect x={x - 30} y="78" width="60" height="78" rx="6" strokeDasharray="5 4" strokeWidth="2" className="fill-white/70 stroke-brand-primary/30" />
      <rect x={x - 20} y="92" width="40" height="22" rx="4" className="fill-brand-primary/10" />
      <rect x={x - 20} y="122" width="28" height="5" rx="2.5" className="fill-brand-primary/15" />
      <rect x={x - 12} y="72" width="24" height="9" rx="2" className="fill-brand-accent/60" />
    </g>
  );
}

export function NoResultsScene({ width }: { width: number }) {
  const cx = width / 2;
  const isWide = width > SCENE_WIDTH.phone;
  // The middle stays clear so the person and torch read first.
  const posters = isWide ? [-340, -260, -180, -100, 100, 180, 260, 340] : [-170, -100, 100, 170];
  const handX = cx + 22;
  const torchTop = 134;
  return (
    <>
      <rect x="0" y={WALL_TOP} width={width} height={WALL_BOTTOM - WALL_TOP} className="fill-brand-primary/10" />
      <rect x="0" y={WALL_TOP - 6} width={width} height="8" rx="2" className="fill-brand-primary/20" />
      {posters.map((dx, i) => (
        <BlankPoster key={dx} x={cx + dx} delay={`${-i * 0.5}s`} />
      ))}
      <rect x="0" y={WALL_BOTTOM} width={width} height={GROUND_Y - WALL_BOTTOM} className="fill-brand-primary/5" />
      <Road width={width} groundY={GROUND_Y} />
      {isWide && <StreetLamp x={cx - 220} groundY={GROUND_Y} />}

      <g className="empty-beam" style={{ transformOrigin: `${handX}px ${torchTop}px` }}>
        <polygon points={`${handX - 6},${torchTop} ${handX + 6},${torchTop} ${handX + 54},20 ${handX - 54},20`} className="fill-brand-accent/20" />
      </g>
      <Person x={cx} feetY={GROUND_Y} tone="fill-brand-primary">
        <Arm fromX={cx + 6} fromY={GROUND_Y - 34} angle={40} tone="fill-brand-primary" />
      </Person>
      <rect x={handX - 4} y={torchTop} width="8" height="14" rx="2" className="fill-brand-accent" />
      <g className="empty-pop">
        <circle cx={cx - 30} cy="126" r="13" className="fill-brand-accent" />
        <text x={cx - 30} y="132" textAnchor="middle" className="fill-white font-heading" fontSize="17" fontWeight="800">?</text>
      </g>
      <Car groundY={GROUND_Y + 19} tone="fill-brand-accent" className="empty-drive-back" />
    </>
  );
}

// A city with no events: the same street as Around You on the home page, but late and quiet.
// Fewer windows lit, one street lamp on, cars still passing, so the city is alive, just not hosting yet.

import { Car, CloudPill, Road, Skyline, Sparkle, StreetLamp } from "./parts";

const GROUND_Y = 200;

export function QuietCityScene({ width }: { width: number }) {
  const cx = width / 2;
  return (
    <>
      <circle cx={cx + 150} cy="40" r="18" className="empty-pulse fill-brand-accent/60" />
      <CloudPill x={cx - 250} y={40} width={70} />
      <CloudPill x={cx + 60} y={64} width={52} delay="-4s" />
      <Sparkle x={cx - 120} y={20} tone="fill-brand-anchor/70" />
      <Sparkle x={cx + 250} y={30} tone="fill-brand-anchor/70" delay="-1.8s" />

      <Skyline cx={cx} groundY={GROUND_Y} litRatio={1} />

      <Road width={width} groundY={GROUND_Y} />
      <ellipse cx={cx - 4} cy={GROUND_Y + 2} rx="40" ry="7" className="empty-pulse fill-brand-accent/30" />
      <StreetLamp x={cx - 20} groundY={GROUND_Y} />
      <Car groundY={GROUND_Y} className="empty-drive" />
      <Car groundY={GROUND_Y + 19} tone="fill-brand-accent" className="empty-drive-back" />
    </>
  );
}

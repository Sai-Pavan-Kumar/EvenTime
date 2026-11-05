"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { isWindowLit, nightAmount, sceneColorsAt, toSolarHour, type SceneWeather } from "./sceneClock";
import { SceneSky } from "./SceneSky";
import { SceneTraffic } from "./SceneTraffic";
import { useCityWeather } from "./useCityWeather";

const WIDTH = 1200;
const HEIGHT = 180;
const TICK_MS = 15_000;
// Flattened arc: the sun climbs fast and stays clear of the skyline for the whole middle of the day.
const ARC_HEIGHT = 182;
const ARC_FLATTENING = 0.6;
const GOLDEN_RATIO_STEP = 0.618034;
const SUN_RISE_HOUR = 6;
const SUN_SET_HOUR = 18;
const WINDOW_LIT_COLOR = "#FDA4AF";

// Tallest stays well under HEIGHT so rooftop details always have room.
const BUILDINGS = [
  { x: 640, width: 60, height: 60 }, { x: 705, width: 44, height: 95 }, { x: 754, width: 70, height: 74 },
  { x: 830, width: 52, height: 112 }, { x: 888, width: 76, height: 84 }, { x: 970, width: 48, height: 104 },
  { x: 1024, width: 66, height: 66 }, { x: 1096, width: 50, height: 90 }, { x: 1152, width: 60, height: 58 },
];
const TREES = [668, 800, 960, 1090];
const ROAD_HEIGHT = 18;
const STARS = [[80, 30], [190, 70], [330, 24], [470, 58], [600, 26], [720, 52], [860, 20], [1010, 40], [1130, 18]];

// Golden-ratio steps scatter the switch-on order, so lights spread across the skyline instead of sweeping along it.
let windowCount = 0;
const WINDOWS_BY_BUILDING = BUILDINGS.map(({ x, width, height }) => {
  const panes = [];
  for (let y = HEIGHT - height + 12; y < HEIGHT - ROAD_HEIGHT - 10; y += 20) {
    for (let paneX = x + 9; paneX < x + width - 10; paneX += 15) {
      if ((y + paneX) % 3 !== 0) panes.push({ x: paneX, y, lightOrder: (windowCount++ * GOLDEN_RATIO_STEP) % 1 });
    }
  }
  return panes;
});

// The sun and moon cross the same arc: progress 0 at one horizon, 1 at the other.
function skyBodyPosition(hour: number, width: number) {
  const isDay = hour >= SUN_RISE_HOUR && hour < SUN_SET_HOUR;
  const hoursSinceStart = isDay ? hour - SUN_RISE_HOUR : (hour - SUN_SET_HOUR + 24) % 24;
  const progress = hoursSinceStart / 12;
  return { isDay, x: 80 + progress * (width - 160), y: HEIGHT + 30 - Math.sin(progress * Math.PI) ** ARC_FLATTENING * ARC_HEIGHT };
}

// Skylines read as cardboard when every top is flat, so buildings take turns carrying a rooftop detail.
function Rooftop({ x, width, top, color, accent, index }: { x: number; width: number; top: number; color: string; accent: string; index: number }) {
  const middle = x + width / 2;
  if (index % 3 === 0) return <><rect x={middle - 1} y={top - 22} width="2" height="22" fill={color} /><circle cx={middle} cy={top - 24} r="2.5" fill={accent} /></>;
  if (index % 3 === 1) return <path d={`M${middle - 14} ${top}a14 14 0 0 1 28 0Z`} fill={color} />;
  return <><rect x={x + 8} y={top - 12} width="16" height="12" fill={color} /><rect x={x + 6} y={top - 14} width="20" height="3" fill={color} /></>;
}


export function GreetingScene({ children, city }: { children: ReactNode; city?: string | null }) {
  const weather: SceneWeather = useCityWeather(city);
  const [hour, setHour] = useState<number | null>(null);
  const [flipped, setFlipped] = useState<number[]>([]);
  const nearRef = useRef<SVGGElement>(null);
  const farRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewWidth, setViewWidth] = useState(WIDTH);
  const [pixelSize, setPixelSize] = useState({ width: 0, height: 0 });
  const [isOnScreen, setIsOnScreen] = useState(true);
  const reduceMotion = useReducedMotion();

  // Read after mount: the server's clock and timezone are not the visitor's.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setHour(now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600);
    };
    tick();
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // The drawing is widened to match the banner's real shape, so a long screen adds sky instead of cropping buildings.
  const hasMounted = hour !== null;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (height > 0) setViewWidth(Math.max(WIDTH, Math.round((width / height) * HEIGHT)));
      setPixelSize({ width, height });
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [hasMounted]);

  // Nothing should burn battery once the banner has scrolled away.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(([entry]) => setIsOnScreen(entry.isIntersecting));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Written straight to the DOM, so following the pointer never re-renders the scene.
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientX - box.left) / box.width - 0.5;
    nearRef.current?.setAttribute("transform", `translate(${offset * -14} 0)`);
    farRef.current?.setAttribute("transform", `translate(${offset * -6} 0)`);
  };

  const toggleLights = (index: number) => {
    setFlipped((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));
  };

  // The drawing thinks in a 6-to-6 day, so real sunrise and sunset simply stretch the clock it reads.
  const solarHour = toSolarHour(hour ?? 12, city);
  const phase = sceneColorsAt(solarHour, weather);
  const body = skyBodyPosition(solarHour, viewWidth);
  const skylineOffset = viewWidth - WIDTH;
  const night = nightAmount(solarHour);
  const scale = pixelSize.height ? Math.max(pixelSize.width / viewWidth, pixelSize.height / HEIGHT) : 0;
  const widthScale = viewWidth / WIDTH;
  const skyBodyOpacity = { clear: 1, cloudy: 0.4, drizzle: 0.2, rain: 0 }[weather];

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      style={{ backgroundColor: hour === null ? undefined : phase.sky }}
      className="relative h-32 overflow-hidden rounded-3xl bg-slate-100 transition-colors duration-[2000ms] motion-reduce:transition-none sm:h-40"
    >
      {hour !== null && (
        <svg ref={svgRef} viewBox={`0 0 ${viewWidth} ${HEIGHT}`} preserveAspectRatio="xMaxYMax slice" className="absolute inset-x-0 bottom-0 h-1/2 w-full overflow-visible sm:h-full [&_*]:transition-[fill,opacity] [&_*]:duration-[2000ms] motion-reduce:[&_*]:transition-none">
          {weather === "clear" && STARS.map(([x, y]) => <circle key={x} cx={x * widthScale} cy={y} r="1.6" fill="#FFFFFF" opacity={night * 0.8} />)}
          <g opacity={skyBodyOpacity}>
            {body.isDay && <circle cx={body.x} cy={body.y} r="36" fill={phase.glow} opacity="0.3" />}
            <circle cx={body.x} cy={body.y} r={body.isDay ? 26 : 20} fill={phase.glow} />
            {!body.isDay && <circle cx={body.x + 9} cy={body.y - 5} r="17" fill={phase.sky} />}
          </g>
          <g transform={`translate(${skylineOffset} 0)`}>
          <g ref={farRef}>
            {BUILDINGS.map(({ x, width, height }) => (
              <rect key={x} x={x - 26} y={HEIGHT - height - 20} width={width} height={height + 20} fill={phase.far} />
            ))}
          </g>
          <g ref={nearRef}>
            {BUILDINGS.map(({ x, width, height }, index) => (
              <g key={x} onClick={() => toggleLights(index)} className="cursor-pointer">
                <Rooftop x={x} width={width} top={HEIGHT - height} color={phase.near} accent={phase.glow} index={index} />
                <rect x={x} y={HEIGHT - height} width={width} height={height} fill={phase.near} />
                {WINDOWS_BY_BUILDING[index].map((pane) => {
                  const isLit = isWindowLit(solarHour, pane.lightOrder) !== flipped.includes(index);
                  return <rect key={`${pane.x}-${pane.y}`} data-lit={isLit} x={pane.x} y={pane.y} width="6" height="9" fill={isLit ? WINDOW_LIT_COLOR : phase.sky} opacity={isLit ? 1 : 0.35} />;
                })}
              </g>
            ))}
            {TREES.map((x) => (
              <g key={x}>
                <rect x={x - 1.5} y={HEIGHT - ROAD_HEIGHT - 12} width="3" height="12" fill={phase.far} />
                <circle cx={x} cy={HEIGHT - ROAD_HEIGHT - 18} r="9" fill={phase.far} />
              </g>
            ))}
          </g>
          </g>
          <rect y={HEIGHT - ROAD_HEIGHT} width={viewWidth} height={ROAD_HEIGHT} fill={phase.near} />
          <line x1="0" x2={viewWidth} y1={HEIGHT - 8} y2={HEIGHT - 8} stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="14 12" />
        </svg>
      )}
      {hour !== null && scale > 0 && (
        <div className={`pointer-events-none absolute inset-0 overflow-hidden ${isOnScreen ? "" : "scene-paused"}`}>
          <SceneSky weather={weather} color={phase.cloud} scale={scale} height={HEIGHT} widthScale={widthScale} opacity={weather === "clear" ? (1 - night) * 0.85 : 0.85} animate={!reduceMotion} />
          <SceneTraffic hour={hour} weather={weather} city={city} pixelWidth={pixelSize.width} scale={scale} widthScale={widthScale} animate={!reduceMotion} lightsOn={night > 0.5} />
        </div>
      )}
      <h1
        style={{ color: hour === null ? undefined : phase.ink }}
        className="pointer-events-none relative truncate p-4 text-slate-900 transition-colors duration-[2000ms] motion-reduce:transition-none sm:max-w-[50%] font-heading text-[22px] font-black tracking-[-0.4px] sm:p-6 sm:text-3xl"
      >
        {children}
      </h1>
    </div>
  );
}

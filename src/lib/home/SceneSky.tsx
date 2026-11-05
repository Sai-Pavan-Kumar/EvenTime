"use client";

import type { SceneWeather } from "./sceneClock";

const CLOUDS = [{ x: 180, y: 34, duration: 90 }, { x: 560, y: 58, duration: 130 }, { x: 900, y: 24, duration: 110 }];
const STORM_CLOUDS = [{ x: 370, y: 20, duration: 100 }, { x: 740, y: 44, duration: 120 }, { x: 1060, y: 50, duration: 95 }];
const CLOUD_DRIFT = 120;
const CLOUD_WIDTH = 64;
const RAIN_OPACITY: Partial<Record<SceneWeather, number>> = { drizzle: 0.3, rain: 0.6 };
const RAIN_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' stroke='white' stroke-width='1.2' stroke-linecap='round'>${[[12, 8], [52, 38], [92, 14], [28, 62], [72, 82], [108, 58], [8, 98], [48, 104]].map(([x, y]) => `<line x1='${x}' y1='${y}' x2='${x - 2}' y2='${y + 12}'/>`).join("")}</svg>`
)}")`;

// Clouds and rain live on their own GPU layers: animating them inside the city drawing repainted it every frame.
export function SceneSky({ weather, color, scale, height, widthScale, opacity, animate }: {
  weather: SceneWeather; color: string; scale: number; height: number; widthScale: number; opacity: number; animate: boolean;
}) {
  const rainOpacity = RAIN_OPACITY[weather] ?? 0;
  const isRaining = rainOpacity > 0;

  return (
    <>
      <div className="transition-opacity duration-[2000ms] motion-reduce:transition-none" style={{ opacity }}>
        {[...CLOUDS, ...STORM_CLOUDS].map(({ x, y, duration }) => (
          <svg
            key={x}
            viewBox="-4 -12 64 34"
            className="absolute left-0 bottom-0 overflow-visible transition-opacity duration-[2000ms] motion-reduce:transition-none"
            width={CLOUD_WIDTH * scale}
            height={34 * scale}
            style={{
              // Extra clouds stay mounted and fade, so a weather change drifts in instead of popping.
              opacity: weather === "clear" && STORM_CLOUDS.some((cloud) => cloud.x === x) ? 0 : 1,
              left: x * widthScale * scale,
              bottom: (height - y - 22) * scale,
              willChange: animate ? "transform" : undefined,
              animation: animate ? `scene-drift ${duration}s ease-in-out infinite alternate` : undefined,
              "--drift": `${CLOUD_DRIFT * scale}px`,
            } as React.CSSProperties}
          >
            <path d="M0 0a12 12 0 0 1 22-6a15 15 0 0 1 28 2a10 10 0 0 1 4 18h-52a9 9 0 0 1-2-14Z" fill={color} className="transition-[fill] duration-[2000ms] motion-reduce:transition-none" />
          </svg>
        ))}
      </div>
      <div
        data-rain={weather}
        className="absolute inset-x-0 bottom-0 -top-[120px] transition-opacity duration-[2000ms] motion-reduce:transition-none"
        style={{ opacity: rainOpacity, backgroundImage: RAIN_TILE, willChange: animate && isRaining ? "transform" : undefined, animation: animate && isRaining ? "scene-rain 0.8s linear infinite" : undefined }}
      />
    </>
  );
}

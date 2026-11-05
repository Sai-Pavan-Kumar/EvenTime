"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { SceneWeather } from "./sceneClock";
import { SceneIncident } from "./SceneIncident";
import { activeIncident } from "./sceneIncidents";
import { Sprite, VehicleBody } from "./SceneVehicles";
import { crossingSeconds, isNightTraffic, parkedBikesFor, trafficFor, type VehicleType } from "./trafficRules";

const OFFSCREEN = 60;
const LANE_GROUND = [9, 1];
const ROADSIDE_GROUND = 18;
const HEADLIGHT = "#FEF3C7";
const SPRITE_HEIGHT = 22;
const INCIDENT_LANE_SPEED = [0.15, 0.5];

const VEHICLE_FRONT: Record<VehicleType, number> = { bike: 15, auto: 18, car: 28, bus: 46, truck: 44 };

// Each lane is one painted strip holding two copies of its traffic. Sliding it by one copy loops forever on a single GPU layer,
// so a jam of 44 vehicles costs the same as an empty road.
export function SceneTraffic({ hour, weather, city, pixelWidth, scale, widthScale, animate, lightsOn }: {
  hour: number; weather: SceneWeather; city?: string | null; pixelWidth: number; scale: number; widthScale: number; animate: boolean; lightsOn: boolean;
}) {
  // Rebuilt only when the traffic pattern changes, so the 15-second clock tick doesn't restart every vehicle.
  const hourBand = Math.floor(hour);
  const vehicles = useMemo(() => trafficFor(hourBand, weather, city), [hourBand, weather, city]);
  const duration = crossingSeconds(weather, widthScale, vehicles.length);
  const parkedBikes = parkedBikesFor(hourBand, weather, city);
  const isNight = isNightTraffic(hourBand);
  const margin = OFFSCREEN * scale;
  const period = pixelWidth + margin * 2;
  const incident = activeIncident(hour, new Date(), city);
  const incidentId = incident?.id;
  const laneRefs = useRef<(SVGSVGElement | null)[]>([]);

  // Playback rate eases traffic down without restarting the slide, which a changed CSS duration would make jump.
  useEffect(() => {
    laneRefs.current.forEach((strip, lane) => {
      strip?.getAnimations().forEach((animation) => animation.updatePlaybackRate(incidentId === undefined ? 1 : INCIDENT_LANE_SPEED[lane]));
    });
  }, [incidentId, duration, animate]);
  const periodUnits = period / scale;

  return (
    <>
      {Array.from({ length: parkedBikes }, (_, index) => (
        <Sprite key={index} data-parked="true" scale={scale} style={{ bottom: ROADSIDE_GROUND * scale, left: pixelWidth - (90 + index * 130) * scale }}>
          <VehicleBody type="bike" />
        </Sprite>
      ))}
      {([0, 1] as const).map((lane) => {
        const flip = lane === 1;
        const motion: CSSProperties = animate
          ? { willChange: "transform", animation: `scene-drive ${duration}s linear infinite`, ["--from" as string]: `${flip ? 0 : -period}px`, ["--to" as string]: `${flip ? -period : 0}px` }
          : { transform: `translateX(${-period / 2}px)` };
        return (
          <svg
            key={lane}
            ref={(element) => { laneRefs.current[lane] = element; }}
            data-lane={lane}
            viewBox={`0 -20 ${periodUnits * 2} ${SPRITE_HEIGHT}`}
            width={period * 2}
            height={SPRITE_HEIGHT * scale}
            className="absolute overflow-visible"
            style={{ left: -margin, bottom: LANE_GROUND[lane] * scale, ...motion }}
          >
            {[0, periodUnits].map((copyOffset) =>
              vehicles.filter((vehicle) => vehicle.lane === lane).map(({ id, type, phase }) => (
                <g key={`${copyOffset}-${id}-${type}`} data-vehicle={copyOffset === 0 ? type : undefined} transform={`translate(${copyOffset + phase * periodUnits} 0)${flip ? " translate(46 0) scale(-1 1)" : ""}`} style={{ animation: "scene-fade-in 2s ease-out" }}>
                  <VehicleBody type={type} />
                  {(lightsOn || isNight) && <circle cx={VEHICLE_FRONT[type]} cy="-5" r="1.5" fill={HEADLIGHT} />}
                </g>
              ))
            )}
          </svg>
        );
      })}
      {incident && <SceneIncident key={incident.id} elapsedSeconds={incident.elapsedSeconds} pixelWidth={pixelWidth} scale={scale} animate={animate} />}
    </>
  );
}

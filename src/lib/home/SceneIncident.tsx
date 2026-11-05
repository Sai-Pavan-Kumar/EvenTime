"use client";

import { useState, type CSSProperties } from "react";
import { INCIDENT_SECONDS } from "./sceneIncidents";
import { Sprite, VehicleBody } from "./SceneVehicles";

const ROADSIDE_GROUND = 15;
const CRASH_POSITION = 0.3;
const HAZARD = "#F97316";

function blink(animate: boolean, delaySeconds = 0): CSSProperties | undefined {
  return animate ? { animation: `scene-hazard 0.9s steps(1) ${delaySeconds}s infinite` } : undefined;
}

function Ambulance({ animate }: { animate: boolean }) {
  return (
    <>
      <rect x="1" y="-14" width="34" height="12" rx="1.5" fill="#FFFFFF" />
      <path d="M35 -2v-8h5l4 4v4Z" fill="#E2E8F0" />
      <rect x="1" y="-8" width="43" height="1.5" fill="#EF4444" />
      <path d="M13 -13h3v3h3v3h-3v-1h-3Z" fill="#EF4444" />
      <circle cx="28" cy="-16" r="2" fill="#EF4444" style={blink(animate)} />
      <circle cx="33" cy="-16" r="2" fill="#3B82F6" style={blink(animate, 0.45)} />
      <circle cx="8" cy="-2" r="2.5" fill="#1E293B" />
      <circle cx="37" cy="-2" r="2.5" fill="#1E293B" />
    </>
  );
}

// Sits on the road's edge because lanes slide as whole strips and would otherwise drive through the crash.
export function SceneIncident({ elapsedSeconds, pixelWidth, scale, animate }: { elapsedSeconds: number; pixelWidth: number; scale: number; animate: boolean }) {
  // Fixed at mount: the timeline is a single CSS animation, and a changing delay would restart it.
  const [delay] = useState(-elapsedSeconds);
  const crashX = pixelWidth * CRASH_POSITION;
  const bottom = ROADSIDE_GROUND * scale;
  const timeline = `${INCIDENT_SECONDS}s linear ${delay}s both`;
  const crashStyle: CSSProperties = { bottom, left: crashX, animation: animate ? `scene-incident ${timeline}` : undefined };

  return (
    <div data-incident="true">
      <Sprite scale={scale} style={crashStyle}>
        <g transform="rotate(-9 14 -4)"><VehicleBody type="car" /></g>
        <circle cx="1" cy="-6" r="1.8" fill={HAZARD} style={blink(animate)} />
      </Sprite>
      <Sprite scale={scale} style={{ ...crashStyle, left: crashX + 27 * scale }}>
        <g transform="translate(28 0) scale(-1 1) rotate(7 14 -4)"><VehicleBody type="car" /></g>
        <circle cx="27" cy="-6" r="1.8" fill={HAZARD} style={blink(animate)} />
      </Sprite>
      <Sprite
        scale={scale}
        style={{
          bottom,
          ...(animate
            ? { willChange: "transform", animation: `scene-ambulance ${timeline}`, ["--from" as string]: `${-60 * scale}px`, ["--stop" as string]: `${crashX - 52 * scale}px`, ["--to" as string]: `${pixelWidth + 60 * scale}px` }
            : { transform: `translateX(${crashX - 52 * scale}px)` }),
        }}
      >
        <Ambulance animate={animate} />
      </Sprite>
    </div>
  );
}

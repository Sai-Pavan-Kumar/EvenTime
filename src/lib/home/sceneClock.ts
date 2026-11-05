import { CITY_COORDINATES } from "@/lib/constants/cityCoordinates";

export type SceneWeather = "clear" | "cloudy" | "drizzle" | "rain";

type Rgb = [number, number, number];

const NIGHT = { sky: "#1A1040", far: "#2A1F66", near: "#0D0B1A", glow: "#E8E5FF" };
const DAWN = { sky: "#FCE7F3", far: "#D8B4E2", near: "#6B4E9B", glow: "#FB7185" };
const DAY = { sky: "#DBEAFE", far: "#A5C4F5", near: "#4C6FBF", glow: "#FFFFFF" };
const MIDDAY = { sky: "#B3D4FC", far: "#8FB4EE", near: "#3F62B5", glow: "#FFFFFF" };
const SUNSET = { sky: "#FFE4E6", far: "#E9A6C4", near: "#6C47FF", glow: "#FB7185" };

// The scene holds a colour between these hours and blends across the gaps, so it never visibly jumps.
const KEYFRAMES = [
  { hour: 0, colors: NIGHT }, { hour: 5, colors: NIGHT }, { hour: 6.5, colors: DAWN }, { hour: 8.5, colors: DAY }, { hour: 11, colors: MIDDAY },
  { hour: 14.5, colors: MIDDAY }, { hour: 16, colors: DAY }, { hour: 18, colors: SUNSET }, { hour: 19.25, colors: NIGHT }, { hour: 24, colors: NIGHT },
];

const OVERCAST_COLOR = "#64748B";
const OVERCAST_STRENGTH: Record<SceneWeather, number> = { clear: 0, cloudy: 0.3, drizzle: 0.4, rain: 0.5 };

// Evening runs 5:30 to 7:00 so a few windows glow by 6 and all by 7; morning reverses it from 5:00 to 6:45.
const LIGHTS_ON_START = 17.5;
const LIGHTS_ON_SPAN = 1.5;
const LIGHTS_OFF_START = 5;
const LIGHTS_OFF_SPAN = 1.75;

const DARK_INK = "#0F172A";
const LIGHT_INK = "#FFFFFF";

function toRgb(hex: string): Rgb {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as Rgb;
}

function blend(from: Rgb, to: Rgb, amount: number): Rgb {
  return from.map((channel, index) => channel + (to[index] - channel) * amount) as Rgb;
}

function toCss(color: Rgb) {
  return `rgb(${color.map(Math.round).join(" ")})`;
}

function luminance(color: Rgb) {
  const [red, green, blue] = color.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

// The sky passes through every shade, so the better of two inks is picked to keep the greeting readable throughout.
function readableInk(background: Rgb) {
  const backgroundLuminance = luminance(background);
  const contrastWithLight = 1.05 / (backgroundLuminance + 0.05);
  const contrastWithDark = (backgroundLuminance + 0.05) / (luminance(toRgb(DARK_INK)) + 0.05);
  return contrastWithLight > contrastWithDark ? LIGHT_INK : DARK_INK;
}

export function sceneColorsAt(hour: number, weather: SceneWeather) {
  const nextIndex = KEYFRAMES.findIndex((frame) => frame.hour > hour);
  const next = KEYFRAMES[nextIndex === -1 ? KEYFRAMES.length - 1 : nextIndex];
  const previous = KEYFRAMES[Math.max((nextIndex === -1 ? KEYFRAMES.length - 1 : nextIndex) - 1, 0)];
  const progress = next.hour === previous.hour ? 0 : (hour - previous.hour) / (next.hour - previous.hour);
  const overcast = toRgb(OVERCAST_COLOR);
  const layer = (key: keyof typeof NIGHT) => blend(blend(toRgb(previous.colors[key]), toRgb(next.colors[key]), progress), overcast, OVERCAST_STRENGTH[weather]);
  const sky = layer("sky");

  return {
    sky: toCss(sky),
    far: toCss(layer("far")),
    near: toCss(layer("near")),
    glow: toCss(blend(toRgb(previous.colors.glow), toRgb(next.colors.glow), progress)),
    cloud: toCss(blend(sky, toRgb(weather === "rain" || weather === "drizzle" ? "#475569" : "#FFFFFF"), 0.7)),
    ink: readableInk(sky),
  };
}

// Each window owns a fixed place (0 to 1) in the order, so the same windows light first every evening.
export function isWindowLit(hour: number, lightOrder: number) {
  return hour >= LIGHTS_ON_START + lightOrder * LIGHTS_ON_SPAN || hour < LIGHTS_OFF_START + lightOrder * LIGHTS_OFF_SPAN;
}

// 0 in full daylight, 1 in full night.
export function nightAmount(hour: number) {
  if (hour >= 19.25 || hour < 5) return 1;
  if (hour >= 18) return (hour - 18) / 1.25;
  if (hour < 6) return 6 - hour;
  return 0;
}

const DEGREE = Math.PI / 180;
const DEFAULT_SUNRISE = 6;
const DEFAULT_SUNSET = 18;
const SUN_HORIZON_DEGREES = -0.83;

// Standard sunrise equation, in the visitor's clock hours. Accurate to a few minutes, which is all a banner needs.
function daylightFor(city: string | null | undefined, date: Date) {
  const coordinates = city ? CITY_COORDINATES[city as keyof typeof CITY_COORDINATES] : undefined;
  if (!coordinates) return { sunrise: DEFAULT_SUNRISE, sunset: DEFAULT_SUNSET };
  const [latitude, longitude] = coordinates;
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86_400_000);
  const declination = 23.44 * DEGREE * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
  const yearAngle = (2 * Math.PI * (dayOfYear - 81)) / 364;
  const equationOfTimeHours = (9.87 * Math.sin(2 * yearAngle) - 7.53 * Math.cos(yearAngle) - 1.5 * Math.sin(yearAngle)) / 60;
  const cosHourAngle = (Math.sin(SUN_HORIZON_DEGREES * DEGREE) - Math.sin(latitude * DEGREE) * Math.sin(declination)) / (Math.cos(latitude * DEGREE) * Math.cos(declination));
  const halfDayHours = Math.acos(cosHourAngle) / DEGREE / 15;
  const utcOffsetHours = -date.getTimezoneOffset() / 60;
  const solarNoon = 12 - longitude / 15 + utcOffsetHours - equationOfTimeHours;
  return { sunrise: solarNoon - halfDayHours, sunset: solarNoon + halfDayHours };
}

export function toSolarHour(hour: number, city: string | null | undefined, date = new Date()) {
  const { sunrise, sunset } = daylightFor(city, date);
  if (hour >= sunrise && hour < sunset) return DEFAULT_SUNRISE + ((hour - sunrise) * 12) / (sunset - sunrise);
  const hoursSinceSunset = hour >= sunset ? hour - sunset : hour + 24 - sunset;
  return (DEFAULT_SUNSET + (hoursSinceSunset * 12) / (24 - sunset + sunrise)) % 24;
}

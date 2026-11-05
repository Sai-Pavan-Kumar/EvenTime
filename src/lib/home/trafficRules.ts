import type { SceneWeather } from "./sceneClock";

export type VehicleType = "bike" | "auto" | "car" | "bus" | "truck";
export type TrafficVehicle = { id: string; type: VehicleType; lane: 0 | 1; phase: number };

type Mix = Partial<Record<VehicleType, number>>;

// The heavy group is TomTom's published India top 10 (Ernakulam is Kochi); the medium group is a judgement call, not a ranking.
const HEAVY_CITIES = ["Bengaluru", "Pune", "Mumbai", "New Delhi", "Kolkata", "Jaipur", "Chennai", "Hyderabad", "Kochi", "Ahmedabad"];
const MEDIUM_CITIES = ["Gurugram", "Noida", "Lucknow", "Indore", "Surat", "Nagpur", "Coimbatore", "Visakhapatnam", "Vijayawada", "Bhopal", "Kanpur"];
// 44 is bumper to bumper: about the most that fit on the road without overlapping, even if every vehicle were a bus.
const PEAK_VEHICLES = { heavy: 44, medium: 22, light: 10 };

const DAY_MIX: Mix = { bike: 0.45, auto: 0.15, car: 0.25, bus: 0.1, truck: 0.05 };
// After dark the roads belong to long-distance freight and overnight travel buses.
const NIGHT_MIX: Mix = { truck: 0.45, bus: 0.3, car: 0.25 };
const RAIN_DAY_MIX: Mix = { auto: 0.25, car: 0.5, bus: 0.2, truck: 0.05 };

const GOLDEN_RATIO_STEP = 0.618034;
const RAIN_SLOWDOWN = 1.4;
const BASE_CROSSING_SECONDS = 16;
const JAM_SLOWDOWN = 4;

// Share of peak traffic for each hour, midnight first: school and office rush, a lunch dip, then the long evening crawl.
const HOURLY_TRAFFIC = [
  0.12, 0.1, 0.1, 0.1, 0.12, 0.15, 0.25, 0.45, 0.8, 1, 1, 0.8,
  0.65, 0.6, 0.55, 0.6, 0.75, 0.95, 1, 1, 0.85, 0.6, 0.4, 0.2,
];

export function isNightTraffic(hour: number) {
  return hour >= 23 || hour < 5;
}

function peakVehiclesFor(city: string | null | undefined) {
  if (city && HEAVY_CITIES.includes(city)) return PEAK_VEHICLES.heavy;
  if (city && MEDIUM_CITIES.includes(city)) return PEAK_VEHICLES.medium;
  return PEAK_VEHICLES.light;
}

// Largest-remainder rounding, so small counts still give each type its fair share.
function vehicleTypesFor(mix: Mix, total: number) {
  const shares = Object.entries(mix).map(([type, share]) => ({ type: type as VehicleType, exact: share * total }));
  const counts = shares.map((item) => ({ ...item, count: Math.floor(item.exact) }));
  const missing = total - counts.reduce((sum, item) => sum + item.count, 0);
  [...counts].sort((a, b) => b.exact - b.count - (a.exact - a.count)).slice(0, missing).forEach((item) => { item.count += 1; });
  return counts.flatMap((item) => Array<VehicleType>(item.count).fill(item.type));
}

// Vehicles in a lane share one speed and even spacing, so they can never drive through each other.
export function trafficFor(hour: number, weather: SceneWeather, city: string | null | undefined): TrafficVehicle[] {
  const total = Math.max(2, Math.round(peakVehiclesFor(city) * HOURLY_TRAFFIC[Math.floor(hour)]));
  const mix = isNightTraffic(hour) ? NIGHT_MIX : weather === "rain" ? RAIN_DAY_MIX : DAY_MIX;
  const types = vehicleTypesFor(mix, total)
    .map((type, index) => ({ type, order: (index * GOLDEN_RATIO_STEP) % 1 }))
    .sort((a, b) => a.order - b.order);

  const lanes: [VehicleType[], VehicleType[]] = [[], []];
  types.forEach(({ type }, index) => lanes[index % 2].push(type));
  return lanes.flatMap((laneTypes, lane) =>
    laneTypes.map((type, index) => ({ id: `${lane}-${index}`, type, lane: lane as 0 | 1, phase: index / laneTypes.length }))
  );
}

// A full road crawls: speed falls with how crowded the road is, not with the time on the clock.
export function crossingSeconds(weather: SceneWeather, widthScale: number, vehicleCount: number) {
  const crowding = Math.min(vehicleCount / PEAK_VEHICLES.heavy, 1);
  return BASE_CROSSING_SECONDS * widthScale * (1 + crowding ** 2 * JAM_SLOWDOWN) * (weather === "rain" ? RAIN_SLOWDOWN : 1);
}

// Riders wait out the rain at the roadside, except overnight when there are none on the road anyway.
export function parkedBikesFor(hour: number, weather: SceneWeather, city: string | null | undefined) {
  if (weather !== "rain" || isNightTraffic(hour)) return 0;
  return Math.min(8, Math.max(2, Math.round(peakVehiclesFor(city) * 0.4)));
}

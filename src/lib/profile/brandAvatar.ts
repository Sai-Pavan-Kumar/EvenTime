// Every picture is computed from the username, so nothing is stored or downloaded
// and the same person looks identical on every screen and device.

const OUTLINE_POINTS = 96;
const CENTER_X = 50;
const CENTER_Y = 52;
const UP = -Math.PI / 2;

const COLOR_WAYS = [
  { background: "#6C47FF", body: "#0D0B1A", feature: "#FFFFFF" },
  { background: "#8B6DFF", body: "#0D0B1A", feature: "#FFFFFF" },
  { background: "#B7A4FF", body: "#0D0B1A", feature: "#FFFFFF" },
  { background: "#E8E5FF", body: "#6C47FF", feature: "#FFFFFF" },
  { background: "#F1EDFF", body: "#0D0B1A", feature: "#FFFFFF" },
  { background: "#0D0B1A", body: "#8B6DFF", feature: "#0D0B1A" },
  { background: "#0D0B1A", body: "#FFFFFF", feature: "#0D0B1A" },
  { background: "#2A1F66", body: "#B7A4FF", feature: "#0D0B1A" },
];

type Random = () => number;
type Point = [number, number];

const between = (random: Random, low: number, high: number) => low + random() * (high - low);
const oneOf = <T,>(random: Random, items: readonly T[]) => items[Math.floor(random() * items.length)];
const round = (value: number) => Math.round(value * 100) / 100;
const pointText = ([x, y]: Point) => `${round(x)} ${round(y)}`;

function hashSeed(seed: string, salt: number) {
  let hash = 0x811c9dc5 ^ salt;
  for (const char of seed) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
    hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  }
  return hash >>> 0;
}

function createRandom(seed: string): Random {
  let state = hashSeed(seed, 0);
  let extra = hashSeed(seed, 0x9e3779b9);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    extra = Math.imul(extra ^ (extra >>> 13), 0x5bd1e995) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state) ^ extra;
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// Samples a symmetric curve, then uses the samples as curve controls so the outline has no corners.
function polarPath(radius: (angle: number) => number, size: number) {
  const angles = Array.from({ length: OUTLINE_POINTS }, (_, index) => (index / OUTLINE_POINTS) * Math.PI * 2);
  const largest = Math.max(...angles.map(radius));
  const points = angles.map((angle): Point => {
    const distance = (radius(angle) / largest) * size;
    return [CENTER_X + distance * Math.cos(angle + UP), CENTER_Y + distance * Math.sin(angle + UP)];
  });
  const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const curves = points.map((point, index) => `Q${pointText(point)} ${pointText(midpoint(point, points[(index + 1) % OUTLINE_POINTS]))}`);
  return `M${pointText(midpoint(points[OUTLINE_POINTS - 1], points[0]))}${curves.join("")}Z`;
}

function roundedCornersPath(corners: Point[], cornerShare: number) {
  const towards = (from: Point, to: Point): Point => [from[0] + (to[0] - from[0]) * cornerShare, from[1] + (to[1] - from[1]) * cornerShare];
  const segments = corners.map((corner, index) => {
    const previous = corners[(index + corners.length - 1) % corners.length];
    const next = corners[(index + 1) % corners.length];
    return `${index === 0 ? "M" : "L"}${pointText(towards(corner, previous))}Q${pointText(corner)} ${pointText(towards(corner, next))}`;
  });
  return `${segments.join("")}Z`;
}

// Exact geometry and whole-number symmetry keep every silhouette looking designed; free-form blobs look cheap.
const BODY_FAMILIES: ((random: Random, size: number) => string)[] = [
  function flower(random, size) {
    const lobes = oneOf(random, [4, 5, 6, 8]);
    const depth = between(random, 0.12, 0.2);
    return polarPath((angle) => 1 + depth * Math.cos(lobes * angle), size * 1.05);
  },
  function badge(random, size) {
    const lobes = oneOf(random, [10, 12]);
    const depth = between(random, 0.04, 0.065);
    return polarPath((angle) => 1 + depth * Math.cos(lobes * angle), size);
  },
  function squircle(random, size) {
    const power = between(random, 3, 5);
    return polarPath((angle) => (Math.abs(Math.cos(angle)) ** power + Math.abs(Math.sin(angle)) ** power) ** (-1 / power), size * 1.08);
  },
  function polygon(random, size) {
    const sides = oneOf(random, [3, 5, 6, 8]);
    // A flat top on even-sided shapes reads calmer than a point.
    const turn = sides % 2 === 0 ? Math.PI / sides : 0;
    const corners = Array.from({ length: sides }, (_, index): Point => {
      const angle = UP + turn + (index / sides) * Math.PI * 2;
      return [CENTER_X + size * 1.14 * Math.cos(angle), CENTER_Y + size * 1.14 * Math.sin(angle)];
    });
    return roundedCornersPath(corners, between(random, 0.26, 0.4));
  },
  function star(random, size) {
    const points = oneOf(random, [4, 5, 6, 8]);
    const waist = between(random, 0.72, 0.8);
    return polarPath((angle) => waist + (1 - waist) * Math.abs(Math.cos((points * angle) / 2)) ** 1.4, size * 1.12);
  },
  function arch(random, size) {
    const halfWidth = size * between(random, 0.82, 0.96);
    const top = CENTER_Y - size;
    const bottom = CENTER_Y + size * 0.9;
    const corner = between(random, 4, 8);
    const left = CENTER_X - halfWidth;
    const right = CENTER_X + halfWidth;
    return `M${round(left)} ${round(top + halfWidth)}A${round(halfWidth)} ${round(halfWidth)} 0 0 1 ${round(right)} ${round(top + halfWidth)}V${round(bottom - corner)}Q${round(right)} ${round(bottom)} ${round(right - corner)} ${round(bottom)}H${round(left + corner)}Q${round(left)} ${round(bottom)} ${round(left)} ${round(bottom - corner)}Z`;
  },
];

const EYE_STYLES = ["round", "tall", "wide", "happy", "sleepy", "wink", "pupil"] as const;
const MOUTH_STYLES = ["none", "none", "smile", "grin"] as const;
const LOOK_DIRECTIONS = [-1, 0, 0, 1] as const;

function pickFace(random: Random) {
  return {
    eyes: oneOf(random, EYE_STYLES),
    mouth: oneOf(random, MOUTH_STYLES),
    gap: round(between(random, 7, 10)),
    size: round(between(random, 3.2, 4.4)),
    look: oneOf(random, LOOK_DIRECTIONS),
    tilt: 0,
    y: round(between(random, 47, 50)),
  };
}

export function createBrandAvatar(rawSeed: string | null | undefined) {
  const seed = (rawSeed || "eventime").trim().toLowerCase();
  const random = createRandom(seed);
  const colors = oneOf(random, COLOR_WAYS);
  const buildBody = oneOf(random, BODY_FAMILIES);
  const bodyPath = buildBody(random, between(random, 27, 31));
  return { ...colors, bodyPath, face: pickFace(random) };
}

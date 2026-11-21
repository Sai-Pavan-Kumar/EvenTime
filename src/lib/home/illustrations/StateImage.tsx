import Image from "next/image";

type StateImageConfig = {
  /** Image is 2:1 but most slots are 10:3, so this picks which band survives the crop. */
  focus: string;
  /** For art painted edge to edge instead of fading to white, so it melts into the card. */
  fadeEdges?: boolean;
};

const STATE_IMAGES = {
  "for-you": { focus: "center 70%" },
  "around-you": { focus: "center 65%" },
  "campus-eligible": { focus: "center 65%" },
  "campus-all": { focus: "center 65%" },
  "empty-date": { focus: "center 70%" },
  "quiet-city": { focus: "center 70%" },
  "search-idle": { focus: "center 55%" },
  "no-results": { focus: "30% 40%" },
  posted: { focus: "center 40%" },
  registered: { focus: "center 55%" },
  saved: { focus: "center 55%" },
  alerts: { focus: "center 55%", fadeEdges: true },
  leaderboard: { focus: "center 55%" },
  error: { focus: "center 45%" },
  "not-found": { focus: "25% 50%", fadeEdges: true },
} satisfies Record<string, StateImageConfig>;

export type StateImageName = keyof typeof STATE_IMAGES;

// Two linear masks intersected fade all four sides evenly; a radial one left the corners boxy.
const EDGE_FADE =
  "linear-gradient(to right, transparent, black 18%, black 82%, transparent), linear-gradient(to bottom, transparent, black 15%, black 80%, transparent)";
const EDGE_FADE_STYLE = { maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" };

// Decorative only: the heading and message beside it carry the meaning, so alt stays empty.
export function StateImage({ name }: { name: StateImageName }) {
  const { focus, fadeEdges } = STATE_IMAGES[name] as StateImageConfig;

  return (
    <div className="relative h-full w-full" style={fadeEdges ? EDGE_FADE_STYLE : undefined}>
      <Image
        src={`/states/${name}.webp`}
        alt=""
        fill
        sizes="(min-width: 1024px) 900px, 100vw"
        className="object-cover"
        style={{ objectPosition: focus }}
      />
    </div>
  );
}

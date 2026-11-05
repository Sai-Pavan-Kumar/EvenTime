export interface CuratorLevel {
  label: string;
  minEvents: number;
  ringClass: string;
  badgeClass: string;
  bandClass: string;
  scoreClass: string;
  scorePanelClass: string;
  progressClass: string;
}

// Highest first, so the first level a count reaches is the one it holds.
// Only approved events count, otherwise a curator could climb with events nobody has reviewed.
const CURATOR_LEVELS: CuratorLevel[] = [
  {
    label: "Diamond Curator",
    minEvents: 150,
    ringClass: "ring-tier-diamond",
    badgeClass: "bg-tier-diamond-soft text-tier-diamond-ink",
    bandClass: "bg-tier-diamond-band",
    scoreClass: "text-tier-diamond-ink",
    scorePanelClass: "bg-tier-diamond-soft",
    progressClass: "bg-tier-diamond",
  },
  {
    label: "Gold Curator",
    minEvents: 69,
    ringClass: "ring-tier-gold",
    badgeClass: "bg-tier-gold-soft text-tier-gold-ink",
    bandClass: "bg-tier-gold-band",
    scoreClass: "text-tier-gold-ink",
    scorePanelClass: "bg-tier-gold-soft",
    progressClass: "bg-tier-gold",
  },
  {
    label: "Silver Curator",
    minEvents: 30,
    ringClass: "ring-tier-silver",
    badgeClass: "bg-tier-silver-soft text-tier-silver-ink",
    bandClass: "bg-tier-silver-band",
    scoreClass: "text-tier-silver-ink",
    scorePanelClass: "bg-tier-silver-soft",
    progressClass: "bg-tier-silver",
  },
  {
    label: "Bronze Curator",
    minEvents: 10,
    ringClass: "ring-tier-bronze",
    badgeClass: "bg-tier-bronze-soft text-tier-bronze-ink",
    bandClass: "bg-tier-bronze-band",
    scoreClass: "text-tier-bronze-ink",
    scorePanelClass: "bg-tier-bronze-soft",
    progressClass: "bg-tier-bronze",
  },
  {
    label: "Curator",
    minEvents: 0,
    ringClass: "ring-brand-primary",
    badgeClass: "bg-brand-primary/10 text-brand-primary",
    bandClass: "bg-tier-curator-band",
    scoreClass: "text-brand-primary",
    scorePanelClass: "bg-brand-primary/10",
    progressClass: "bg-brand-primary",
  },
];

export function getCuratorLevel(approvedEventCount: number): CuratorLevel {
  return CURATOR_LEVELS.find((level) => approvedEventCount >= level.minEvents) ?? CURATOR_LEVELS[CURATOR_LEVELS.length - 1];
}

export function getNextCuratorLevel(approvedEventCount: number): CuratorLevel | null {
  return [...CURATOR_LEVELS].reverse().find((level) => approvedEventCount < level.minEvents) ?? null;
}

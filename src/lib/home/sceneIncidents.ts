export const INCIDENT_SECONDS = 180;

// One accident in the day and two after dark; a narrow window makes catching one a bit of luck.
const INCIDENT_WINDOWS = [
  { from: 8, to: 18 },
  { from: 19, to: 21.5 },
  { from: 21.5, to: 24 },
];

// Seeded by date and city, so everyone in a city sees the same accident at the same moment, with no server involved.
function seededFraction(seed: string) {
  let hash = 2166136261;
  for (const character of seed) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  // Without this final mix, neighbouring dates land at almost the same time every day.
  hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
  return ((hash ^ (hash >>> 16)) >>> 0) / 2 ** 32;
}

export function incidentStartHours(date: Date, city: string | null | undefined) {
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return INCIDENT_WINDOWS.map(({ from, to }, index) => {
    const latestStart = to - INCIDENT_SECONDS / 3600;
    return from + seededFraction(`${dateKey}|${city ?? "india"}|${index}`) * (latestStart - from);
  });
}

export function activeIncident(hour: number, date: Date, city: string | null | undefined) {
  const start = incidentStartHours(date, city).find((startHour) => hour >= startHour && hour < startHour + INCIDENT_SECONDS / 3600);
  return start === undefined ? null : { id: start, elapsedSeconds: (hour - start) * 3600 };
}

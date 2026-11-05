import { Award } from "lucide-react";
import type { CuratorLevel } from "@/lib/profile/curatorLevel";

// The name sits beside the colour because a new visitor cannot know what a colour means on its own.
export function CuratorLevelBadge({ level }: { level: CuratorLevel }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${level.badgeClass}`}>
      <Award className="h-3.5 w-3.5" aria-hidden="true" />
      {level.label}
    </span>
  );
}

import type { ReactNode } from "react";

export type SceneLayout = "phone" | "wide";

export const SCENE_WIDTH: Record<SceneLayout, number> = { phone: 420, wide: 800 };

// Phones (under 480px) get the narrow canvas, fitted whole; wider screens get the wide canvas, cropped to the middle.
// Cropping one wide drawing for phones cut whole characters off, so every scene draws both layouts.
export function ResponsiveScene({ render }: { render: (layout: SceneLayout) => ReactNode }) {
  return (
    <>
      <svg viewBox="0 -20 420 240" preserveAspectRatio="xMidYMax meet" className="h-full w-full min-[480px]:hidden" aria-hidden="true" focusable="false">
        {render("phone")}
      </svg>
      <svg viewBox="0 -20 800 240" preserveAspectRatio="xMidYMax slice" className="hidden h-full w-full min-[480px]:block" aria-hidden="true" focusable="false">
        {render("wide")}
      </svg>
    </>
  );
}

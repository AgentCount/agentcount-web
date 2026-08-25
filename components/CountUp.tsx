"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The fifth client component in this app, and the fourth by choice.
 *
 * It exists for one purpose — a standalone population figure counting up on
 * mount — reversing the "static, deliberately not animated" call the hero's
 * population figure (`app/page.tsx`) and `MiniPanel.tsx`'s count used to
 * make independently, each with its own version of the same argument: a
 * count-up would turn a server-rendered number into client state for a
 * purely decorative flourish. Asked for by name, for both: the hero's own
 * figure, and every `MiniPanel` (`AgentDirectory.tsx`, `data/page.tsx`,
 * `reports/page.tsx`) — which is why this lives as its own component rather
 * than inlined once, the moment a second call site needed the identical
 * behaviour.
 *
 * `value` is what the server already computed, and it is also this
 * component's OWN initial render state — not zero. A reader with JavaScript
 * off, or who sees the page before it hydrates, gets the correct total
 * immediately, exactly as `population.toLocaleString(…)` rendered it inline
 * before this component existed; nothing here depends on the animation
 * running to be correct. Only once mounted does the effect drop the display
 * to zero and count back up over `durationMs` — one deliberate flash,
 * traded for every visitor's first paint still being right regardless of
 * whether the script beneath it ever loads.
 *
 * `finalText`, when given, is what the display SETTLES on instead of
 * `value.toLocaleString("en-US")` — for `MiniPanel`'s report call site,
 * which holds its totals as an already-formatted string it must not
 * re-derive (see that file's own doc, and `lib/reports.ts`). `value` there
 * is still a real number, parsed once just to drive the animation's
 * intermediate frames — the resting text, before mount and after the count
 * finishes, is always the exact string the caller was given, never a second
 * computation of it.
 *
 * `prefers-reduced-motion` skips the count entirely, leaving the resting
 * total in place. This is the one motion on the site that has to check for
 * it explicitly: the transition/`active:scale` presses elsewhere ride CSS,
 * which already honours that media query on its own, but a
 * `requestAnimationFrame` loop does not.
 */
export function CountUp({
  value,
  finalText,
  durationMs = 900,
}: {
  value: number;
  finalText?: string;
  durationMs?: number;
}) {
  const settled = finalText ?? value.toLocaleString("en-US");
  const [display, setDisplay] = useState(settled);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (value <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    startRef.current = null;
    let frame: number;
    // The reset to zero happens inside the first animation frame below
    // (`t` is ~0 on it) rather than as a `setDisplay` call here in the
    // effect body — react-hooks' `set-state-in-effect` rule flags a
    // synchronous `setState` directly in an effect as a footgun for
    // cascading renders, and a callback the effect merely schedules is
    // the pattern it wants instead.
    const step = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out cubic: fast start, settling into place rather than
      // stopping abruptly — the total should read as arriving, not as
      // being switched off mid-count.
      const eased = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        setDisplay(Math.round(eased * value).toLocaleString("en-US"));
        frame = requestAnimationFrame(step);
      } else {
        // Snap to the exact settled text rather than one more rounded
        // frame, so a `finalText` caller never ends one digit off its own
        // source string.
        setDisplay(settled);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, settled, durationMs]);

  return <>{display}</>;
}

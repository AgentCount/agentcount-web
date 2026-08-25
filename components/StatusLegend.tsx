import { TextLink } from "./TextLink";
import {
  NOT_CHECKED_GLYPH,
  NOT_CHECKED_LABEL,
  statusGlyph,
  statusInkClass,
  statusLabel,
} from "@/lib/status";

/**
 * The six states, spelled out, on every page that shows a badge or a bar.
 *
 * Previously this only existed as inline text under each rate bar, which meant
 * the directory — the page with the most badges on it — explained none of
 * them. A reader who does not already know that `skipped` and "not checked"
 * are different claims cannot learn it from a colour.
 *
 * Set as a single ruled strip rather than a bordered panel: it is a key, and a
 * key should sit quietly beside the thing it explains rather than compete
 * with it for weight. It renders directly above the table on `/directory`
 * and `/working` — moved up from below the pagination, where a reader had
 * already scanned every glyph on the page once before learning what any of
 * them meant. The rule above it still separates it from whatever precedes
 * it (the filter form), which is all `border-t` ever meant here.
 *
 * The status words come from the run's own vocabulary, not a literal list, so
 * this legend cannot describe a status the API no longer produces or omit one
 * it just started producing. "not checked" is appended separately because it
 * is the ABSENCE of a row rather than a status — no run reports it, and it
 * would never appear in a vocabulary drawn from the API.
 */
function Entry({
  glyph,
  ink,
  word,
  meaning,
}: {
  glyph: string;
  ink: string;
  word: string;
  meaning: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span aria-hidden="true" className={`font-mono text-xs ${ink}`}>
        {glyph}
      </span>
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-text">
        {word}
      </span>
      <span className="text-[0.6875rem] text-dead">{meaning}</span>
    </span>
  );
}

/** Trim the "word — meaning" labels down to just the meaning, since the word
 * is already printed beside it. */
function meaningOf(label: string, word: string): string {
  const dash = label.indexOf("— ");
  if (dash >= 0) return label.slice(dash + 2);
  return label === word ? "" : label;
}

export function StatusLegend({ statuses }: { statuses: string[] }) {
  return (
    <section aria-label="What each status means" className="border-t border-line pt-3">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="label">Key</span>
        {statuses.map((s) => (
          <Entry
            key={s}
            glyph={statusGlyph(s)}
            ink={statusInkClass(s)}
            word={s}
            meaning={meaningOf(statusLabel(s), s)}
          />
        ))}
        <Entry
          glyph={NOT_CHECKED_GLYPH}
          ink="text-dead"
          word="not checked"
          meaning={meaningOf(NOT_CHECKED_LABEL, "not checked")}
        />
        <TextLink href="/methodology" className="text-[0.6875rem]">
          Full definitions
        </TextLink>
      </div>
    </section>
  );
}

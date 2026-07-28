export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: number | string;
  note?: string;
}) {
  return (
    <div className="rounded-xl bg-panel p-5">
      <div className="text-sm uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </div>
      {note && <div className="mt-1 text-sm text-dead">{note}</div>}
    </div>
  );
}

// Stand-in content for pages not yet designed (built out in later phases).
export function PlaceholderPage({ eyebrow, note }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">{eyebrow}</p>
      <p className="mt-2 text-sm text-ink-muted">{note}</p>
    </div>
  );
}

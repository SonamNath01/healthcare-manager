import { Loader2 } from "lucide-react";

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <Loader2 size={22} strokeWidth={1.75} className="animate-spin text-ink-faint" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

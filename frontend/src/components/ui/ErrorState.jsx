import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong py-16 text-center">
      <AlertCircle size={20} strokeWidth={1.75} className="text-critical" aria-hidden="true" />
      <p className="text-[14px] text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

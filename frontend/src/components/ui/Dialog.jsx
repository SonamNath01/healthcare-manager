import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { IconButton } from "./Button";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, children, size = "md" }) {
  const maxWidth = size === "lg" ? "max-w-lg" : "max-w-md";
  const titleId = useId();
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Remember what had focus so it can be restored once the dialog closes,
    // and trap Tab/Shift+Tab inside the panel while it's open.
    previouslyFocused.current = document.activeElement;
    panelRef.current?.focus();
    const raf = requestAnimationFrame(() => setEntered(true));

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-150 ease-[var(--ease-standard)] ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-lg border border-line bg-surface p-6 shadow-modal transition-[opacity,transform] duration-150 ease-[var(--ease-standard)] focus:outline-none ${maxWidth} ${
          entered ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
            {title}
          </h2>
          <IconButton aria-label="Close" onClick={onClose} className="-mr-1 -mt-1">
            <X size={18} strokeWidth={1.75} />
          </IconButton>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

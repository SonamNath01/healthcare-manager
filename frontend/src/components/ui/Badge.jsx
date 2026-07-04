import clsx from "clsx";

const VARIANTS = {
  neutral: "bg-canvas-subtle text-ink-muted",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  critical: "bg-critical-subtle text-critical",
  accent: "bg-accent-subtle text-accent-strong",
};

export function Badge({ variant = "neutral", className, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

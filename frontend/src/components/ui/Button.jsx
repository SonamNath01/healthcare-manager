import { forwardRef } from "react";
import clsx from "clsx";

const VARIANTS = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-strong",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-accent hover:text-accent-strong",
  ghost: "bg-transparent text-ink-muted hover:bg-canvas-subtle hover:text-ink",
  destructive:
    "bg-surface text-critical border border-line-strong hover:bg-critical-subtle hover:border-critical",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-[15px] gap-2",
};

export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center rounded-md font-semibold whitespace-nowrap",
        "transition-[background-color,border-color,color,transform] duration-[120ms] ease-[var(--ease-standard)]",
        "active:translate-y-px disabled:opacity-40 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton(
  { variant = "ghost", className, children, "aria-label": ariaLabel, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      className={clsx(
        
        "inline-flex items-center justify-center rounded-md h-9 w-9 shrink-0",
        "transition-[background-color,border-color,color] duration-[120ms] ease-[var(--ease-standard)]",
        "active:translate-y-px disabled:opacity-40 disabled:pointer-events-none",
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

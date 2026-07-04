import { forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef(function Input(
  { label, error, hint, id, className, ...props },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "h-10 rounded-md border bg-surface px-3 text-[14px] text-ink placeholder:text-ink-faint",
          "transition-colors duration-[120ms] ease-[var(--ease-standard)]",
          "focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent",
          error ? "border-critical" : "border-line-strong",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-[13px] text-critical">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-[13px] text-ink-faint">
          {hint}
        </p>
      )}
    </div>
  );
});

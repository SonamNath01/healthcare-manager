import { Link } from "react-router-dom";

export function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="px-6 py-6">
        <Link
          to="/"
          className="font-display text-[15px] font-bold tracking-tight text-ink"
        >
          Healthcare Manager
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          {eyebrow && (
            <p className="font-mono text-xs uppercase tracking-wide text-accent-strong">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-[14px] leading-6 text-ink-muted">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && (
            <p className="mt-6 text-center text-[14px] text-ink-muted">{footer}</p>
          )}
        </div>
      </main>
    </div>
  );
}

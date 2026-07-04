import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <p className="font-mono text-sm text-ink-faint">404</p>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        We couldn't find that page
      </h1>
      <Link to="/" className="text-sm font-medium text-accent-strong hover:underline">
        Back home
      </Link>
    </div>
  );
}

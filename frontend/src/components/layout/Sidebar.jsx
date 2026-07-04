import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { NAVIGATION, ROLE_LABEL } from "../../config/navigation";

export function Sidebar({ role }) {
  const items = NAVIGATION[role];

  return (
    <aside
      className={clsx(
        "hidden md:flex md:flex-col md:sticky md:top-0 md:h-dvh md:shrink-0",
        "w-18 lg:w-62 border-r border-line bg-surface"
      )}
    >
      <div className="flex h-16 items-center px-4 lg:px-6 border-b border-line">
        <span className="font-display font-bold text-[15px] text-ink tracking-tight hidden lg:inline">
          Healthcare Manager
        </span>
        <span className="font-display font-bold text-ink lg:hidden" aria-hidden="true">
          HM
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 lg:px-3" aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {items.map(({ label, to, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    "transition-colors duration-[120ms] ease-[var(--ease-standard)]",
                    "justify-center lg:justify-start",
                    isActive
                      ? "bg-accent-subtle text-accent-strong"
                      : "text-ink-muted hover:bg-canvas-subtle hover:text-ink"
                  )
                }
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line px-2 py-3 lg:px-3">
        <span className="hidden lg:block text-xs font-medium text-ink-faint uppercase tracking-wide px-3">
          {ROLE_LABEL[role]} account
        </span>
      </div>
    </aside>
  );
}

import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { NAVIGATION } from "../../config/navigation";

export function MobileNav({ role }) {
  const items = NAVIGATION[role];

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-10 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {items.map(({ label, to, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium",
                  "transition-colors duration-[120ms] ease-[var(--ease-standard)]",
                  isActive ? "text-accent-strong" : "text-ink-faint"
                )
              }
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

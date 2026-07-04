import { useEffect, useRef, useState } from "react";
import { useMatches, useNavigate } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { IconButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABEL } from "../../config/navigation";

function useTitle() {
  const matches = useMatches();
  const withTitle = [...matches].reverse().find((m) => m.handle?.title);
  return withTitle?.handle?.title ?? "";
}

export function Topbar({ role }) {
  const title = useTitle();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const roleLabel = ROLE_LABEL[role];

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  const initial = (user?.name?.[0] ?? roleLabel[0]).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/95 backdrop-blur px-4 md:px-8">
      <h1 className="font-display text-[18px] font-semibold tracking-tight text-ink truncate">
        {title}
      </h1>
      <div className="flex items-center gap-2 shrink-0">
        <IconButton aria-label="Notifications">
          <Bell size={20} strokeWidth={1.75} />
        </IconButton>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle text-accent-strong font-display text-[13px] font-bold transition-colors duration-[120ms] ease-[var(--ease-standard)] hover:bg-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            {initial}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-md border border-line bg-surface shadow-popover"
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-[13px] font-medium text-ink">
                  {user?.name ?? `${roleLabel} account`}
                </p>
                <p className="truncate text-[12px] text-ink-faint">{user?.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-ink-muted transition-colors duration-[120ms] ease-[var(--ease-standard)] hover:bg-critical-subtle hover:text-critical"
              >
                <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

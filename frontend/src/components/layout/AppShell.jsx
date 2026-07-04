import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";

export function AppShell({ role }) {
  const location = useLocation();

  return (
    <div className="flex min-h-dvh bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:shadow-modal"
      >
        Skip to content
      </a>
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar role={role} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 focus:outline-none"
        >
          <div key={location.pathname} className="mx-auto w-full max-w-5xl animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav role={role} />
    </div>
  );
}

import { Link } from "react-router-dom";
import { Search, Stethoscope, Users, CalendarCheck } from "lucide-react";
import { Button } from "../components/ui/Button";

const ROLE_CARDS = [
  {
    icon: Search,
    title: "Find care, fast",
    body: "Search real-time availability by specialty, book a slot, and get a calendar invite automatically — no phone tag.",
  },
  {
    icon: Stethoscope,
    title: "Walk in already briefed",
    body: "Before every visit, an AI-generated summary flags urgency and surfaces relevant history, so the first five minutes aren't spent catching up.",
  },
  {
    icon: Users,
    title: "Run the schedule, not chase it",
    body: "Manage doctor rosters, working hours, and leave from one place — appointments update in real time, with no double-booking.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Search",
    body: "Filter doctors by specialty and see actual open slots, not just office hours.",
  },
  {
    n: "02",
    title: "Book",
    body: "Reserve a slot instantly. A confirmation and calendar invite go out automatically.",
  },
  {
    n: "03",
    title: "Follow up",
    body: "Reminders land before the visit; summaries and notes stay attached to the record after.",
  },
];

export function Landing() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">
            Healthcare Manager
          </span>
          <nav className="flex items-center gap-2" aria-label="Account">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Get started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="max-w-lg">
              <p className="font-mono text-xs uppercase tracking-wide text-accent-strong">
                Healthcare Manager
              </p>
              <h1 className="mt-4 font-display text-[40px] font-bold leading-[1.1] tracking-tight text-ink md:text-[46px]">
                Every appointment, prepared before it starts.
              </h1>
              <p className="mt-5 text-[15px] leading-7 text-ink-muted">
                Patients book in minutes. Doctors walk in with an AI-prepared
                summary. Admins keep the whole clinic in sync — without
                another spreadsheet.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link to="/register">
                  <Button variant="primary" size="lg">
                    Get started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-5 shadow-popover">
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                  Today, 3:30 PM
                </p>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[15px] font-semibold text-ink">
                      Dr. Amara Chen
                    </p>
                    <p className="text-[13px] text-ink-muted">Cardiology</p>
                  </div>
                  <span className="shrink-0 rounded-sm bg-success-subtle px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-success">
                    Confirmed
                  </span>
                </div>

                <div className="mt-5 rounded-md border border-line bg-canvas-subtle p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                      AI pre-visit summary
                    </p>
                    <span className="rounded-sm bg-warning-subtle px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-warning">
                      Medium
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                    Follow-up on elevated blood pressure readings from last
                    visit. Patient reports occasional dizziness — recommend
                    reviewing current medication dosage.
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[12px] text-ink-faint">
                  <CalendarCheck size={14} strokeWidth={1.75} aria-hidden="true" />
                  <span>Synced to Google Calendar</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              Built around three very different days
            </h2>
            <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-8">
              {ROLE_CARDS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="border-t border-line pt-6 lg:border-t-0 lg:pt-0">
                  <Icon size={22} strokeWidth={1.75} className="text-accent-strong" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-[17px] font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-6 text-ink-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
            How it works
          </h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-8">
            {STEPS.map(({ n, title, body }) => (
              <div key={n}>
                <p className="font-mono text-[13px] font-medium text-ink-faint">{n}</p>
                <h3 className="mt-2 font-display text-[17px] font-semibold text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <span className="font-display text-sm font-semibold text-ink">
            Healthcare Manager
          </span>
          <span className="text-[13px] text-ink-faint">
            © 2026 Healthcare Manager
          </span>
        </div>
      </footer>
    </div>
  );
}

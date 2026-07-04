import { CalendarClock } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../lib/apiClient";

export function DoctorSettings() {
  const { user, token } = useAuth();

  return (
    <div className="max-w-lg">
      <section>
        <h2 className="font-display text-[15px] font-semibold text-ink">Account</h2>
        <div className="mt-3 rounded-lg border border-line bg-surface p-5">
          <p className="text-[13px] text-ink-faint">Name</p>
          <p className="text-[14px] text-ink">{user?.name}</p>
          <p className="mt-3 text-[13px] text-ink-faint">Email</p>
          <p className="text-[14px] text-ink">{user?.email}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-[15px] font-semibold text-ink">Calendar</h2>
        <div className="mt-3 flex items-start gap-4 rounded-lg border border-line bg-surface p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
            <CalendarClock size={18} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-ink">Google Calendar</p>
            <p className="mt-1 text-[13px] leading-6 text-ink-muted">
              Connect your Google Calendar so confirmed and completed visits stay in sync
              automatically.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() =>
                window.open(`${API_URL}/doctor/google/connect?token=${token}`, "_blank", "noopener")
              }
            >
              Connect Google Calendar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

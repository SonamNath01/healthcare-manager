import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { VisitNoteDialog } from "../../components/doctor/VisitNoteDialog";
import { useAuth } from "../../context/AuthContext";
import { getDoctorAppointments } from "../../api/doctorPortal";
import { formatTimeLabel, toISODate } from "../../lib/date";
import { URGENCY_VARIANT } from "../../lib/urgency";

export function DoctorDashboard() {
  const { token } = useAuth();
  const [visitTarget, setVisitTarget] = useState(null);
  const today = toISODate(new Date());

  const appointmentsQuery = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: () => getDoctorAppointments(token),
    select: (data) => data.appointments,
  });

  const todayAppointments = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    return appointments
      .filter((a) => a.date.slice(0, 10) === today && !a.cancelledAt)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointmentsQuery.data, today]);

  if (appointmentsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-ink-faint">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        <span className="text-[14px]">Loading today's schedule…</span>
      </div>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <ErrorState message="Couldn't load today's schedule." onRetry={() => appointmentsQuery.refetch()} />
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Today's schedule</h1>

      <div className="mt-6">
        {todayAppointments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong py-16 text-center">
            <CalendarDays size={20} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
            <p className="text-[14px] text-ink-muted">No appointments today.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                      {formatTimeLabel(appointment.startTime)}
                    </p>
                    <p className="mt-1 font-display text-[15px] font-semibold text-ink">
                      {appointment.patient.name}
                    </p>
                    {appointment.reasonForVisit && (
                      <p className="text-[13px] text-ink-muted">{appointment.reasonForVisit}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {appointment.aiUrgency && (
                      <Badge variant={URGENCY_VARIANT[appointment.aiUrgency] ?? "neutral"}>
                        {appointment.aiUrgency}
                      </Badge>
                    )}
                    {appointment.completedAt && <Badge variant="neutral">Completed</Badge>}
                  </div>
                </div>

                {appointment.aiSummary && (
                  <div className="mt-4 rounded-md border border-line bg-canvas-subtle p-4">
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                      AI pre-visit summary
                    </p>
                    <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">{appointment.aiSummary}</p>
                    {appointment.aiSuggestedQuestions?.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1">
                        {appointment.aiSuggestedQuestions.map((question, i) => (
                          <li key={i} className="text-[13px] text-ink-muted before:content-['—_'] before:text-ink-faint">
                            {question}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {!appointment.completedAt && (
                  <Button size="sm" className="mt-4" onClick={() => setVisitTarget(appointment)}>
                    Add visit notes
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {visitTarget && (
        <VisitNoteDialog appointment={visitTarget} onClose={() => setVisitTarget(null)} />
      )}
    </div>
  );
}

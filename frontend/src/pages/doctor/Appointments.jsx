import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, Pill } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { VisitNoteDialog } from "../../components/doctor/VisitNoteDialog";
import { useAuth } from "../../context/AuthContext";
import { getDoctorAppointments } from "../../api/doctorPortal";
import { formatDateLabel, formatTimeLabel, toISODate } from "../../lib/date";
import { URGENCY_VARIANT } from "../../lib/urgency";

function statusFor(appointment) {
  if (appointment.cancelledAt) return { label: "Cancelled", variant: "critical" };
  if (appointment.completedAt) return { label: "Completed", variant: "neutral" };
  return { label: "Scheduled", variant: "success" };
}

function DoctorAppointmentCard({ appointment, today, onAddNotes }) {
  const status = statusFor(appointment);
  const canAddNotes = !appointment.cancelledAt && !appointment.completedAt && appointment.date.slice(0, 10) <= today;

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[15px] font-semibold text-ink">{appointment.patient.name}</p>
          <p className="text-[13px] text-ink-muted">{appointment.patient.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {appointment.aiUrgency && !appointment.completedAt && (
            <Badge variant={URGENCY_VARIANT[appointment.aiUrgency] ?? "neutral"}>
              {appointment.aiUrgency}
            </Badge>
          )}
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      <p className="mt-3 text-[13px] text-ink-muted">
        {formatDateLabel(appointment.date)} · {formatTimeLabel(appointment.startTime)}–
        {formatTimeLabel(appointment.endTime)}
      </p>

      {appointment.reasonForVisit && (
        <p className="mt-2 text-[13px] text-ink-muted">
          <span className="text-ink-faint">Reason: </span>
          {appointment.reasonForVisit}
        </p>
      )}

      {appointment.aiSummary && !appointment.completedAt && (
        <div className="mt-4 rounded-md border border-line bg-canvas-subtle p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            AI pre-visit summary
          </p>
          <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">{appointment.aiSummary}</p>
        </div>
      )}

      {appointment.completedAt && appointment.doctorNotes && (
        <div className="mt-4 rounded-md border border-line bg-canvas-subtle p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">Visit notes</p>
          <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">{appointment.doctorNotes}</p>
        </div>
      )}

      {appointment.prescriptions?.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            <Pill size={13} strokeWidth={1.75} aria-hidden="true" />
            Prescribed
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {appointment.prescriptions.map((prescription) => (
              <li key={prescription.id} className="text-[13px] text-ink-muted">
                <span className="font-medium text-ink">{prescription.medicineName}</span>
                {" — "}
                {prescription.dosage}, {prescription.frequency}, {prescription.durationDays} days
              </li>
            ))}
          </ul>
        </div>
      )}

      {canAddNotes && (
        <Button size="sm" className="mt-4" onClick={() => onAddNotes(appointment)}>
          Add visit notes
        </Button>
      )}
    </div>
  );
}

export function DoctorAppointments() {
  const { token } = useAuth();
  const [visitTarget, setVisitTarget] = useState(null);
  const today = toISODate(new Date());

  const appointmentsQuery = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: () => getDoctorAppointments(token),
    select: (data) => data.appointments,
  });

  const { upcoming, history } = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const upcoming = [];
    const history = [];
    for (const appointment of appointments) {
      const isUpcoming =
        !appointment.cancelledAt && !appointment.completedAt && appointment.date.slice(0, 10) >= today;
      (isUpcoming ? upcoming : history).push(appointment);
    }
    upcoming.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    history.sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
    return { upcoming, history };
  }, [appointmentsQuery.data, today]);

  if (appointmentsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-ink-faint">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        <span className="text-[14px]">Loading appointments…</span>
      </div>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <ErrorState
        message="Couldn't load your appointments."
        onRetry={() => appointmentsQuery.refetch()}
      />
    );
  }

  const isEmpty = upcoming.length === 0 && history.length === 0;

  return (
    <div>
      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong py-16 text-center">
          <CalendarDays size={20} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
          <p className="text-[14px] text-ink-muted">No appointments yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="font-display text-[15px] font-semibold text-ink">Upcoming</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {upcoming.map((appointment) => (
                  <DoctorAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    today={today}
                    onAddNotes={setVisitTarget}
                  />
                ))}
              </div>
            </section>
          )}

          {history.length > 0 && (
            <section>
              <h2 className="font-display text-[15px] font-semibold text-ink">Past</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {history.map((appointment) => (
                  <DoctorAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    today={today}
                    onAddNotes={setVisitTarget}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {visitTarget && (
        <VisitNoteDialog appointment={visitTarget} onClose={() => setVisitTarget(null)} />
      )}
    </div>
  );
}

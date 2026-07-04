import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Pill } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../context/AuthContext";
import { getMyAppointments, cancelAppointment } from "../../api/appointments";
import { formatDateLabel, formatTimeLabel, isTodayOrFuture } from "../../lib/date";
import { ApiError } from "../../lib/apiClient";

function statusFor(appointment) {
  if (appointment.cancelledAt) return { label: "Cancelled", variant: "critical" };
  if (appointment.completedAt) return { label: "Completed", variant: "neutral" };
  return { label: "Confirmed", variant: "success" };
}

function AppointmentCard({ appointment, onCancel }) {
  const status = statusFor(appointment);
  const canCancel = !appointment.cancelledAt && !appointment.completedAt && isTodayOrFuture(appointment.date);

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[15px] font-semibold text-ink">
            {appointment.doctor.user.name}
          </p>
          <p className="text-[13px] text-ink-muted">{appointment.doctor.specialization}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
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

      {appointment.patientSummary && (
        <div className="mt-4 rounded-md border border-line bg-canvas-subtle p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            Visit summary
          </p>
          <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">
            {appointment.patientSummary}
          </p>
        </div>
      )}

      {appointment.prescriptions?.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            <Pill size={13} strokeWidth={1.75} aria-hidden="true" />
            Prescriptions
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

      {canCancel && (
        <Button variant="destructive" size="sm" className="mt-4" onClick={() => onCancel(appointment)}>
          Cancel appointment
        </Button>
      )}
    </div>
  );
}

export function PatientAppointments() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState(null);

  const appointmentsQuery = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => getMyAppointments(token),
    select: (data) => data.appointments,
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentId) => cancelAppointment(appointmentId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setCancelTarget(null);
    },
  });

  const { upcoming, history } = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const upcoming = [];
    const history = [];
    for (const appointment of appointments) {
      if (!appointment.cancelledAt && !appointment.completedAt && isTodayOrFuture(appointment.date)) {
        upcoming.push(appointment);
      } else {
        history.push(appointment);
      }
    }
    upcoming.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    history.sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
    return { upcoming, history };
  }, [appointmentsQuery.data]);

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
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={setCancelTarget}
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
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={setCancelTarget}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {cancelTarget && (
        <Dialog open onClose={() => setCancelTarget(null)} title="Cancel appointment?">
          <p className="text-[14px] text-ink-muted">
            This will cancel your visit with {cancelTarget.doctor.user.name} on{" "}
            {formatDateLabel(cancelTarget.date)} at {formatTimeLabel(cancelTarget.startTime)}.
          </p>

          {cancelMutation.isError && (
            <p role="alert" className="mt-3 text-[13px] text-critical">
              {cancelMutation.error instanceof ApiError
                ? cancelMutation.error.message
                : "Something went wrong. Try again."}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCancelTarget(null)}>
              Keep appointment
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelTarget.id)}
            >
              {cancelMutation.isPending ? "Cancelling…" : "Cancel it"}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

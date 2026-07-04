import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, Pill, Search } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../context/AuthContext";
import { getMyAppointments } from "../../api/appointments";
import { formatDateLabel, formatTimeLabel, isTodayOrFuture } from "../../lib/date";

function activeMedicationsFrom(appointments) {
  const today = new Date();
  const medications = [];
  for (const appointment of appointments) {
    for (const prescription of appointment.prescriptions ?? []) {
      const end = new Date(prescription.createdAt);
      end.setDate(end.getDate() + prescription.durationDays);
      if (end >= today) {
        medications.push({ ...prescription, doctorName: appointment.doctor.user.name });
      }
    }
  }
  return medications;
}

export function PatientDashboard() {
  const { user, token } = useAuth();

  const appointmentsQuery = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => getMyAppointments(token),
    select: (data) => data.appointments,
  });

  const { nextAppointment, restUpcoming, activeMedications, recentSummary } = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const upcoming = appointments
      .filter((a) => !a.cancelledAt && !a.completedAt && isTodayOrFuture(a.date))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

    const withSummary = appointments
      .filter((a) => a.patientSummary)
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

    return {
      nextAppointment: upcoming[0] ?? null,
      restUpcoming: upcoming.slice(1, 4),
      activeMedications: activeMedicationsFrom(appointments),
      recentSummary: withSummary[0] ?? null,
    };
  }, [appointmentsQuery.data]);

  const firstName = user?.name?.split(" ")[0];

  if (appointmentsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-ink-faint">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        <span className="text-[14px]">Loading your dashboard…</span>
      </div>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <ErrorState
        message="Couldn't load your dashboard."
        onRetry={() => appointmentsQuery.refetch()}
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        Welcome back{firstName ? `, ${firstName}` : ""}
      </h1>

      <div className="mt-6">
        {nextAppointment ? (
          <div className="max-w-md rounded-lg border border-line bg-surface p-5 shadow-popover">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              {formatDateLabel(nextAppointment.date)}, {formatTimeLabel(nextAppointment.startTime)}
            </p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[15px] font-semibold text-ink">
                  {nextAppointment.doctor.user.name}
                </p>
                <p className="text-[13px] text-ink-muted">{nextAppointment.doctor.specialization}</p>
              </div>
              <Badge variant="success">Confirmed</Badge>
            </div>
            {nextAppointment.reasonForVisit && (
              <p className="mt-3 text-[13px] text-ink-muted">{nextAppointment.reasonForVisit}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-line-strong p-6">
            <p className="text-[14px] text-ink-muted">No upcoming appointments.</p>
            <Link to="/patient/find-a-doctor">
              <Button size="sm">
                <Search size={15} strokeWidth={1.75} aria-hidden="true" />
                Find a doctor
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-[15px] font-semibold text-ink">Upcoming</h2>
          {restUpcoming.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3">
              {restUpcoming.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3"
                >
                  <div>
                    <p className="text-[13px] font-medium text-ink">{appointment.doctor.user.name}</p>
                    <p className="text-[12px] text-ink-faint">{appointment.doctor.specialization}</p>
                  </div>
                  <p className="text-[12px] text-ink-muted">
                    {formatDateLabel(appointment.date)} · {formatTimeLabel(appointment.startTime)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-line-strong px-4 py-6 text-center">
              <CalendarDays size={16} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
              <p className="text-[13px] text-ink-faint">Nothing else on the calendar.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-[15px] font-semibold text-ink">Active medications</h2>
          {activeMedications.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3">
              {activeMedications.map((medication) => (
                <li
                  key={medication.id}
                  className="rounded-md border border-line bg-surface px-4 py-3"
                >
                  <p className="text-[13px] font-medium text-ink">{medication.medicineName}</p>
                  <p className="text-[12px] text-ink-muted">
                    {medication.dosage} · {medication.frequency}
                  </p>
                  <p className="text-[12px] text-ink-faint">Prescribed by {medication.doctorName}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-line-strong px-4 py-6 text-center">
              <Pill size={16} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
              <p className="text-[13px] text-ink-faint">No active medications.</p>
            </div>
          )}
        </section>
      </div>

      {recentSummary && (
        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-[15px] font-semibold text-ink">Latest visit summary</h2>
          <div className="mt-3 rounded-lg border border-line bg-surface p-5">
            <p className="text-[13px] text-ink-muted">
              {recentSummary.doctor.user.name} · {formatDateLabel(recentSummary.date)}
            </p>
            <p className="mt-2 text-[14px] leading-6 text-ink-muted">{recentSummary.patientSummary}</p>
          </div>
        </section>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getDoctorSlots } from "../../api/doctors";
import { bookAppointment } from "../../api/appointments";
import { toISODate, formatDatePill, formatDateLabel, formatTimeLabel } from "../../lib/date";
import { ApiError } from "../../lib/apiClient";

const UPCOMING_DAYS = 14;

function nextDays(count) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return toISODate(date);
  });
}

export function BookingDialog({ doctor, onClose }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const dates = useMemo(() => nextDays(UPCOMING_DAYS), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const slotsQuery = useQuery({
    queryKey: ["doctor-slots", doctor.id, selectedDate],
    queryFn: () => getDoctorSlots(doctor.id, selectedDate),
    select: (data) => data.slots,
  });

  const booking = useMutation({
    mutationFn: () =>
      bookAppointment(
        { doctorId: doctor.id, date: selectedDate, startTime: selectedSlot, reasonForVisit: reason || undefined },
        token
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setConfirmed(true);
    },
  });

  function handleSelectDate(date) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  if (confirmed) {
    return (
      <Dialog open onClose={onClose} title="Booked">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-subtle text-success">
            <CalendarCheck size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="text-[15px] font-medium text-ink">
            Appointment confirmed with {doctor.user.name}
          </p>
          <p className="text-[14px] text-ink-muted">
            {formatDateLabel(selectedDate)} at {formatTimeLabel(selectedSlot)}
          </p>
          <Button className="mt-2 w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={onClose} title={`Book with ${doctor.user.name}`}>
      <p className="text-[13px] text-ink-muted">{doctor.specialization}</p>

      <div className="mt-5">
        <p className="text-[13px] font-medium text-ink">Date</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {dates.map((date) => {
            const { weekday, day } = formatDatePill(date);
            const isSelected = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                onClick={() => handleSelectDate(date)}
                className={
                  "flex shrink-0 flex-col items-center rounded-md border px-3 py-2 text-center transition-colors duration-[120ms] ease-[var(--ease-standard)] " +
                  (isSelected
                    ? "border-accent bg-accent-subtle text-accent-strong"
                    : "border-line-strong text-ink-muted hover:border-accent hover:text-ink")
                }
              >
                <span className="text-[11px] uppercase tracking-wide">{weekday}</span>
                <span className="font-display text-[15px] font-semibold">{day}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[13px] font-medium text-ink">Time</p>
        <div className="mt-2 min-h-[44px]">
          {slotsQuery.isLoading ? (
            <Loader2 size={18} className="animate-spin text-ink-faint" aria-hidden="true" />
          ) : slotsQuery.data && slotsQuery.data.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slotsQuery.data.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={
                    "rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors duration-[120ms] ease-[var(--ease-standard)] " +
                    (slot === selectedSlot
                      ? "border-accent bg-accent-subtle text-accent-strong"
                      : "border-line-strong text-ink-muted hover:border-accent hover:text-ink")
                  }
                >
                  {formatTimeLabel(slot)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-faint">No availability this day — try another date.</p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="reason" className="text-[13px] font-medium text-ink">
          Reason for visit <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <textarea
          id="reason"
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1.5 w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
          placeholder="Briefly describe what this visit is about"
        />
      </div>

      {booking.isError && (
        <p role="alert" className="mt-4 text-[13px] text-critical">
          {booking.error instanceof ApiError ? booking.error.message : "Something went wrong. Try again."}
        </p>
      )}

      <Button
        className="mt-5 w-full"
        size="lg"
        disabled={!selectedSlot || booking.isPending}
        onClick={() => booking.mutate()}
      >
        {booking.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {booking.isPending ? "Booking…" : "Confirm booking"}
      </Button>
    </Dialog>
  );
}

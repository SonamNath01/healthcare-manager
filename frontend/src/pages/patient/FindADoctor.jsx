import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Stethoscope, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ErrorState } from "../../components/ui/ErrorState";
import { BookingDialog } from "../../components/patient/BookingDialog";
import { searchDoctors } from "../../api/doctors";

export function FindADoctor() {
  const [specialization, setSpecialization] = useState("");
  const [debounced, setDebounced] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(specialization), 300);
    return () => clearTimeout(timeout);
  }, [specialization]);

  const doctorsQuery = useQuery({
    queryKey: ["doctors", debounced],
    queryFn: () => searchDoctors(debounced),
    select: (data) => data.doctors,
  });

  return (
    <div>
      <div className="max-w-sm">
        <Input
          label="Specialization"
          type="search"
          name="specialization"
          placeholder="e.g. Cardiology"
          value={specialization}
          onChange={(event) => setSpecialization(event.target.value)}
        />
      </div>

      <div className="mt-6">
        {doctorsQuery.isLoading ? (
          <div className="flex items-center gap-2 py-12 text-ink-faint">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            <span className="text-[14px]">Loading doctors…</span>
          </div>
        ) : doctorsQuery.isError ? (
          <ErrorState message="Couldn't load doctors." onRetry={() => doctorsQuery.refetch()} />
        ) : doctorsQuery.data && doctorsQuery.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctorsQuery.data.map((doctor) => (
              <div
                key={doctor.id}
                className="flex flex-col rounded-lg border border-line bg-surface p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
                  <Stethoscope size={18} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-[15px] font-semibold text-ink">
                  {doctor.user.name}
                </p>
                <p className="text-[13px] text-ink-muted">{doctor.specialization}</p>
                <p className="mt-1 text-[12px] text-ink-faint">
                  {doctor.slotDurationMinutes}-minute visits
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setBookingDoctor(doctor)}
                >
                  Book
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong py-16 text-center">
            <Search size={20} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
            <p className="text-[14px] text-ink-muted">
              {specialization
                ? `No doctors found for "${specialization}".`
                : "No doctors available right now."}
            </p>
          </div>
        )}
      </div>

      {bookingDoctor && (
        <BookingDialog doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}
    </div>
  );
}

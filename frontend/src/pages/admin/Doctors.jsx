import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Stethoscope } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { AddDoctorDialog } from "../../components/admin/AddDoctorDialog";
import { DoctorDetailDialog } from "../../components/admin/DoctorDetailDialog";
import { useAuth } from "../../context/AuthContext";
import { listDoctors } from "../../api/admin";

export function AdminDoctors() {
  const { token } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  const doctorsQuery = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => listDoctors(token),
    select: (data) => data.doctors,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-muted">
          {doctorsQuery.data ? `${doctorsQuery.data.length} doctors` : ""}
        </p>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus size={15} strokeWidth={1.75} aria-hidden="true" />
          Add doctor
        </Button>
      </div>

      <div className="mt-4">
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
              <button
                key={doctor.id}
                type="button"
                onClick={() => setSelectedDoctorId(doctor.id)}
                className="flex flex-col items-start rounded-lg border border-line bg-surface p-5 text-left transition-colors duration-[120ms] ease-[var(--ease-standard)] hover:border-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
                  <Stethoscope size={18} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-[15px] font-semibold text-ink">
                  {doctor.user.name}
                </p>
                <p className="text-[13px] text-ink-muted">{doctor.specialization}</p>
                <p className="mt-1 text-[12px] text-ink-faint">{doctor.user.email}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong py-16 text-center">
            <Stethoscope size={20} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
            <p className="text-[14px] text-ink-muted">No doctors yet.</p>
          </div>
        )}
      </div>

      {isAdding && <AddDoctorDialog onClose={() => setIsAdding(false)} />}
      {selectedDoctorId && (
        <DoctorDetailDialog doctorId={selectedDoctorId} onClose={() => setSelectedDoctorId(null)} />
      )}
    </div>
  );
}

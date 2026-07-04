import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Stethoscope } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../context/AuthContext";
import { listDoctors } from "../../api/admin";

export function AdminDashboard() {
  const { token } = useAuth();

  const doctorsQuery = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => listDoctors(token),
    select: (data) => data.doctors,
  });

  const { total, specializationCount, recent } = useMemo(() => {
    const doctors = doctorsQuery.data ?? [];
    return {
      total: doctors.length,
      specializationCount: new Set(doctors.map((d) => d.specialization)).size,
      recent: [...doctors].sort((a, b) => b.id - a.id).slice(0, 5),
    };
  }, [doctorsQuery.data]);

  if (doctorsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-ink-faint">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        <span className="text-[14px]">Loading overview…</span>
      </div>
    );
  }

  if (doctorsQuery.isError) {
    return <ErrorState message="Couldn't load the overview." onRetry={() => doctorsQuery.refetch()} />;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Clinic overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-sm">
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="font-display text-2xl font-bold text-ink">{total}</p>
          <p className="text-[13px] text-ink-muted">Doctors</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="font-display text-2xl font-bold text-ink">{specializationCount}</p>
          <p className="text-[13px] text-ink-muted">Specializations</p>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-ink">Recently added</h2>
          <Link to="/admin/doctors">
            <Button variant="ghost" size="sm">
              Manage doctors
            </Button>
          </Link>
        </div>

        {recent.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-3 sm:max-w-md">
            {recent.map((doctor) => (
              <li
                key={doctor.id}
                className="flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
                  <Stethoscope size={15} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink">{doctor.user.name}</p>
                  <p className="text-[12px] text-ink-faint">{doctor.specialization}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 flex flex-col items-start gap-3 rounded-lg border border-dashed border-line-strong p-6 sm:max-w-md">
            <p className="text-[14px] text-ink-muted">No doctors added yet.</p>
            <Link to="/admin/doctors">
              <Button size="sm">Add your first doctor</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

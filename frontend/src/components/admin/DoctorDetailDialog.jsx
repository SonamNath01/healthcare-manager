import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Button, IconButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getDoctor, updateDoctor, setWorkingHours, addLeave, deleteLeave } from "../../api/admin";
import { formatDateLabel } from "../../lib/date";
import { ApiError } from "../../lib/apiClient";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_INPUT_CLASS =
  "h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent";

function DoctorDetailForm({ doctor, onClose }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(doctor.user.name);
  const [specialization, setSpecialization] = useState(doctor.specialization);

  const profileMutation = useMutation({
    mutationFn: () => updateDoctor(doctor.id, { name, specialization }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-doctor", doctor.id] });
    },
  });

  const existingByDay = Object.fromEntries(doctor.workingHours.map((wh) => [wh.dayOfWeek, wh]));
  const [hours, setHours] = useState(() =>
    DAY_LABELS.map((_, day) => ({
      enabled: Boolean(existingByDay[day]),
      startTime: existingByDay[day]?.startTime ?? "09:00",
      endTime: existingByDay[day]?.endTime ?? "17:00",
    }))
  );

  function updateDay(day, field, value) {
    setHours((rows) => rows.map((row, i) => (i === day ? { ...row, [field]: value } : row)));
  }

  const anyDayEnabled = hours.some((row) => row.enabled);

  const hoursMutation = useMutation({
    mutationFn: () =>
      setWorkingHours(
        doctor.id,
        hours
          .map((row, day) => ({ ...row, dayOfWeek: day }))
          .filter((row) => row.enabled)
          .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
        token
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctor", doctor.id] });
    },
  });

  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const addLeaveMutation = useMutation({
    mutationFn: () => addLeave(doctor.id, { startDate: leaveDate, reason: leaveReason || undefined }, token),
    onSuccess: () => {
      setLeaveDate("");
      setLeaveReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-doctor", doctor.id] });
    },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: (leaveId) => deleteLeave(doctor.id, leaveId, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-doctor", doctor.id] }),
  });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="text-[13px] font-medium text-ink">Profile</h3>
        <p className="mt-1 text-[12px] text-ink-faint">{doctor.user.email}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
        </div>
        {profileMutation.isError && (
          <p role="alert" className="mt-2 text-[13px] text-critical">
            {profileMutation.error instanceof ApiError ? profileMutation.error.message : "Something went wrong."}
          </p>
        )}
        <Button
          size="sm"
          className="mt-3"
          disabled={profileMutation.isPending}
          onClick={() => profileMutation.mutate()}
        >
          {profileMutation.isPending ? "Saving…" : "Save profile"}
        </Button>
      </section>

      <section>
        <h3 className="text-[13px] font-medium text-ink">Working hours</h3>
        <div className="mt-3 flex flex-col gap-2">
          {DAY_LABELS.map((label, day) => (
            <div key={day} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <label className="flex w-16 shrink-0 items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={hours[day].enabled}
                  onChange={(e) => updateDay(day, "enabled", e.target.checked)}
                  className="accent-accent"
                />
                {label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hours[day].startTime}
                  disabled={!hours[day].enabled}
                  onChange={(e) => updateDay(day, "startTime", e.target.value)}
                  aria-label={`${FULL_DAY_NAMES[day]} start time`}
                  className={TIME_INPUT_CLASS}
                />
                <span className="text-[12px] text-ink-faint">to</span>
                <input
                  type="time"
                  value={hours[day].endTime}
                  disabled={!hours[day].enabled}
                  onChange={(e) => updateDay(day, "endTime", e.target.value)}
                  aria-label={`${FULL_DAY_NAMES[day]} end time`}
                  className={TIME_INPUT_CLASS}
                />
              </div>
            </div>
          ))}
        </div>
        {!anyDayEnabled && (
          <p className="mt-2 text-[13px] text-critical">At least one working day is required.</p>
        )}
        {hoursMutation.isError && (
          <p role="alert" className="mt-2 text-[13px] text-critical">
            {hoursMutation.error instanceof ApiError ? hoursMutation.error.message : "Something went wrong."}
          </p>
        )}
        <Button
          size="sm"
          className="mt-3"
          disabled={!anyDayEnabled || hoursMutation.isPending}
          onClick={() => hoursMutation.mutate()}
        >
          {hoursMutation.isPending ? "Saving…" : "Save working hours"}
        </Button>
      </section>

      <section>
        <h3 className="text-[13px] font-medium text-ink">Leave</h3>
        {doctor.leaves.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {doctor.leaves.map((leave) => (
              <li
                key={leave.id}
                className="flex items-center justify-between rounded-md border border-line px-3 py-2"
              >
                <div>
                  <p className="text-[13px] text-ink">{formatDateLabel(leave.date)}</p>
                  {leave.reason && <p className="text-[12px] text-ink-faint">{leave.reason}</p>}
                </div>
                <IconButton
                  aria-label="Remove leave"
                  variant="ghost"
                  onClick={() => deleteLeaveMutation.mutate(leave.id)}
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-ink-faint">No leave scheduled.</p>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="leave-date" className="text-[13px] font-medium text-ink">
              Date
            </label>
            <input
              id="leave-date"
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="leave-reason" className="text-[13px] font-medium text-ink">
              Reason <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              id="leave-reason"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
            />
          </div>
          <Button
            size="md"
            className="w-full sm:w-auto"
            disabled={!leaveDate || addLeaveMutation.isPending}
            onClick={() => addLeaveMutation.mutate()}
          >
            Add
          </Button>
        </div>
        {addLeaveMutation.isError && (
          <p role="alert" className="mt-2 text-[13px] text-critical">
            {addLeaveMutation.error instanceof ApiError ? addLeaveMutation.error.message : "Something went wrong."}
          </p>
        )}
      </section>

      <Button variant="secondary" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

export function DoctorDetailDialog({ doctorId, onClose }) {
  const { token } = useAuth();

  const doctorQuery = useQuery({
    queryKey: ["admin-doctor", doctorId],
    queryFn: () => getDoctor(doctorId, token),
    select: (data) => data.doctor,
  });

  return (
    <Dialog open onClose={onClose} title="Manage doctor" size="lg">
      {doctorQuery.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-ink-faint">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          <span className="text-[14px]">Loading…</span>
        </div>
      ) : doctorQuery.data ? (
        <DoctorDetailForm doctor={doctorQuery.data} onClose={onClose} />
      ) : null}
    </Dialog>
  );
}

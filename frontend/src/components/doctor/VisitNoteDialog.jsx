import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Button, IconButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { submitVisit } from "../../api/doctorPortal";
import { ApiError } from "../../lib/apiClient";

const EMPTY_PRESCRIPTION = { medicineName: "", dosage: "", frequency: "", durationDays: "", instructions: "" };

export function VisitNoteDialog({ appointment, onClose }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);

  const mutation = useMutation({
    mutationFn: () =>
      submitVisit(
        appointment.id,
        {
          notes,
          prescriptions: prescriptions.map((p) => ({ ...p, durationDays: Number(p.durationDays) })),
        },
        token
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      onClose();
    },
  });

  function updatePrescription(index, field, value) {
    setPrescriptions((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addPrescription() {
    setPrescriptions((rows) => [...rows, { ...EMPTY_PRESCRIPTION }]);
  }

  function removePrescription(index) {
    setPrescriptions((rows) => rows.filter((_, i) => i !== index));
  }

  const canSubmit =
    notes.trim().length > 0 &&
    prescriptions.every((p) => p.medicineName && p.dosage && p.frequency && p.durationDays);

  return (
    <Dialog open onClose={onClose} title={`Visit notes — ${appointment.patient.name}`} size="lg">
      <p className="text-[13px] text-ink-muted">{appointment.reasonForVisit}</p>

      <div className="mt-5">
        <label htmlFor="notes" className="text-[13px] font-medium text-ink">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-1.5 w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
          placeholder="What happened during this visit?"
        />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-ink">Prescriptions</p>
          <Button variant="ghost" size="sm" onClick={addPrescription}>
            <Plus size={15} strokeWidth={1.75} aria-hidden="true" />
            Add medication
          </Button>
        </div>

        {prescriptions.length > 0 && (
          <div className="mt-2 flex flex-col gap-3">
            {prescriptions.map((prescription, index) => (
              <div key={index} className="rounded-md border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      value={prescription.medicineName}
                      onChange={(e) => updatePrescription(index, "medicineName", e.target.value)}
                      placeholder="Medicine name"
                      aria-label={`Medicine name for medication ${index + 1}`}
                      className="sm:col-span-2 h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
                    />
                    <input
                      value={prescription.dosage}
                      onChange={(e) => updatePrescription(index, "dosage", e.target.value)}
                      placeholder="Dosage (e.g. 500mg)"
                      aria-label={`Dosage for medication ${index + 1}`}
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
                    />
                    <input
                      value={prescription.frequency}
                      onChange={(e) => updatePrescription(index, "frequency", e.target.value)}
                      placeholder="Frequency (e.g. twice daily)"
                      aria-label={`Frequency for medication ${index + 1}`}
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
                    />
                    <input
                      type="number"
                      min="1"
                      value={prescription.durationDays}
                      onChange={(e) => updatePrescription(index, "durationDays", e.target.value)}
                      placeholder="Duration (days)"
                      aria-label={`Duration in days for medication ${index + 1}`}
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
                    />
                    <input
                      value={prescription.instructions}
                      onChange={(e) => updatePrescription(index, "instructions", e.target.value)}
                      placeholder="Instructions (optional)"
                      aria-label={`Instructions for medication ${index + 1}`}
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-subtle focus:border-accent"
                    />
                  </div>
                  <IconButton
                    aria-label="Remove medication"
                    variant="ghost"
                    onClick={() => removePrescription(index)}
                  >
                    <Trash2 size={16} strokeWidth={1.75} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mutation.isError && (
        <p role="alert" className="mt-4 text-[13px] text-critical">
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong. Try again."}
        </p>
      )}

      <Button
        className="mt-5 w-full"
        size="lg"
        disabled={!canSubmit || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {mutation.isPending ? "Saving…" : "Complete visit"}
      </Button>
    </Dialog>
  );
}

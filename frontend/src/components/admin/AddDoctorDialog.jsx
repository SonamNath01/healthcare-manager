import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { createDoctor } from "../../api/admin";
import { ApiError } from "../../lib/apiClient";

export function AddDoctorDialog({ onClose }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");

  const mutation = useMutation({
    mutationFn: () => createDoctor({ name, email, password, specialization }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      onClose();
    },
  });

  const canSubmit = name && email && password.length >= 8 && specialization;

  return (
    <Dialog open onClose={onClose} title="Add a doctor">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <Input label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Temporary password"
          type="password"
          name="password"
          hint="At least 8 characters. Share this with the doctor directly."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Specialization"
          name="specialization"
          placeholder="e.g. Dermatology"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          required
        />

        {mutation.isError && (
          <p role="alert" className="text-[13px] text-critical">
            {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong. Try again."}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {mutation.isPending ? "Adding…" : "Add doctor"}
        </Button>
      </form>
    </Dialog>
  );
}

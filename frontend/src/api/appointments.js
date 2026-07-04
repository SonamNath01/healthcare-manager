import { api } from "../lib/apiClient";

export function bookAppointment(payload, token) {
  return api.post("/appointments", payload, { token });
}

export function getMyAppointments(token) {
  return api.get("/appointments/me", { token });
}

export function cancelAppointment(appointmentId, token) {
  return api.delete(`/appointments/${appointmentId}`, { token });
}

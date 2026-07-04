import { api } from "../lib/apiClient";

export function getDoctorAppointments(token) {
  return api.get("/doctor/appointments", { token });
}

export function submitVisit(appointmentId, payload, token) {
  return api.post(`/doctor/appointments/${appointmentId}/visit`, payload, { token });
}

import { api } from "../lib/apiClient";

export function searchDoctors(specialization) {
  const query = specialization ? `?specialization=${encodeURIComponent(specialization)}` : "";
  return api.get(`/doctors${query}`);
}

export function getDoctorSlots(doctorId, date) {
  return api.get(`/doctors/${doctorId}/slots?date=${date}`);
}

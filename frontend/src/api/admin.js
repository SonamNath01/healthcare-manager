import { api } from "../lib/apiClient";

export function listDoctors(token) {
  return api.get("/admin/doctors", { token });
}

export function getDoctor(doctorId, token) {
  return api.get(`/admin/doctors/${doctorId}`, { token });
}

export function createDoctor(payload, token) {
  return api.post("/admin/doctors", payload, { token });
}

export function updateDoctor(doctorId, payload, token) {
  return api.put(`/admin/doctors/${doctorId}`, payload, { token });
}

export function setWorkingHours(doctorId, workingHours, token) {
  return api.put(`/admin/doctors/${doctorId}/working-hours`, { workingHours }, { token });
}

export function addLeave(doctorId, payload, token) {
  return api.post(`/admin/doctors/${doctorId}/leave`, payload, { token });
}

export function deleteLeave(doctorId, leaveId, token) {
  return api.delete(`/admin/doctors/${doctorId}/leave/${leaveId}`, { token });
}

const doctorService = require("../services/doctorService");
const AppError = require("../utils/AppError");

function parseIntParam(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return parsed;
}

async function createDoctor(req, res) {
  const doctor = await doctorService.createDoctor(req.body);
  res.status(201).json({ doctor });
}

async function listDoctors(req, res) {
  const doctors = await doctorService.listDoctors();
  res.status(200).json({ doctors });
}

async function getDoctor(req, res) {
  const doctorId = parseIntParam(req.params.doctorId, "doctor id");
  const doctor = await doctorService.getDoctorById(doctorId);
  res.status(200).json({ doctor });
}

async function updateDoctor(req, res) {
  const doctorId = parseIntParam(req.params.doctorId, "doctor id");
  const doctor = await doctorService.updateDoctor(doctorId, req.body);
  res.status(200).json({ doctor });
}

async function setWorkingHours(req, res) {
  const doctorId = parseIntParam(req.params.doctorId, "doctor id");
  const workingHours = await doctorService.setWorkingHours(doctorId, req.body.workingHours);
  res.status(200).json({ workingHours });
}

async function addLeave(req, res) {
  const doctorId = parseIntParam(req.params.doctorId, "doctor id");
  const leaves = await doctorService.addLeave(doctorId, req.body);
  res.status(201).json({ leaves });
}

async function deleteLeave(req, res) {
  const doctorId = parseIntParam(req.params.doctorId, "doctor id");
  const leaveId = parseIntParam(req.params.leaveId, "leave id");
  await doctorService.deleteLeave(doctorId, leaveId);
  res.status(204).send();
}

module.exports = {
  createDoctor,
  listDoctors,
  getDoctor,
  updateDoctor,
  setWorkingHours,
  addLeave,
  deleteLeave,
};

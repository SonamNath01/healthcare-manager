const doctorService = require("../services/doctorService");
const AppError = require("../utils/AppError");

async function searchDoctors(req, res) {
  const doctors = await doctorService.searchDoctors({ specialization: req.query.specialization });
  res.status(200).json({ doctors });
}

async function getSlots(req, res) {
  const doctorId = Number(req.params.doctorId);
  if (!Number.isInteger(doctorId)) {
    throw new AppError("Invalid doctor id", 400);
  }
  const slots = await doctorService.getAvailableSlots(doctorId, req.query.date);
  res.status(200).json({ slots });
}

module.exports = { searchDoctors, getSlots };

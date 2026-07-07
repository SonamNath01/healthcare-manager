const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const googleCalendarService = require("../services/googleCalendarService");
const AppError = require("../utils/AppError");

async function connect(req, res) {
  const { token } = req.query;
  if (!token) {
    throw new AppError("A token query parameter is required to start this flow", 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }

  if (decoded.role !== "DOCTOR") {
    throw new AppError("Only doctors can connect a Google Calendar", 403);
  }

  const doctor = await prisma.doctor.findUnique({ where: { userId: decoded.id } });
  if (!doctor) {
    throw new AppError("No doctor profile found for this account", 404);
  }

  res.redirect(googleCalendarService.getAuthUrl(doctor.id));
}
async function callback(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    throw new AppError(`Google OAuth error: ${error}`, 400);
  }
  if (!code || !state) {
    throw new AppError("Missing code or state from Google's redirect", 400);
  }

  const doctorId = Number(state);
  if (!Number.isInteger(doctorId)) {
    throw new AppError("Invalid state parameter", 400);
  }

  await googleCalendarService.handleOAuthCallback(code, doctorId);

  res.send("Google Calendar connected successfully. You can close this window.");
}

module.exports = { connect, callback };

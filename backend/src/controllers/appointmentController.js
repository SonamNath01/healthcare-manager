const appointmentService = require("../services/appointmentService");
const aiService = require("../services/aiService");
const notificationService = require("../services/notificationService");
const googleCalendarService = require("../services/googleCalendarService");
const AppError = require("../utils/AppError");

async function bookAppointment(req, res) {
  const appointment = await appointmentService.bookAppointment(req.user.id, req.body);
  res.status(201).json({ appointment });

  // Fired after the response is already sent, and not awaited: the patient
  // must never wait on this, and its outcome must never affect the booking
  // that already succeeded above. None of these three throws, but .catch()
  // stays here as a backstop against unhandled rejections -- the standard
  // rule for any un-awaited async call. Three separate external services
  // (Gemini, email, Google Calendar), the exact same isolation pattern.
  aiService.generateAndStorePreVisitSummary(appointment).catch((err) => {
    console.error("Unexpected error in AI summary generation:", err);
  });
  notificationService.sendBookingConfirmationEmail(appointment).catch((err) => {
    console.error("Unexpected error sending booking confirmation email:", err);
  });
  googleCalendarService.createEventForAppointment(appointment).catch((err) => {
    console.error("Unexpected error creating Google Calendar event:", err);
  });
}

async function getMyAppointments(req, res) {
  const appointments = await appointmentService.getMyAppointments(req.user.id);
  res.status(200).json({ appointments });
}

async function getDoctorAppointments(req, res) {
  const appointments = await appointmentService.getDoctorAppointments(req.user.id);
  res.status(200).json({ appointments });
}

async function cancelAppointment(req, res) {
  const appointmentId = Number(req.params.appointmentId);
  if (!Number.isInteger(appointmentId)) {
    throw new AppError("Invalid appointment id", 400);
  }

  const appointment = await appointmentService.cancelAppointment(req.user.id, appointmentId);
  res.status(200).json({ appointment });

  notificationService.sendCancellationEmail(appointment).catch((err) => {
    console.error("Unexpected error sending cancellation email:", err);
  });
  googleCalendarService.deleteEventForAppointment(appointment).catch((err) => {
    console.error("Unexpected error deleting Google Calendar event:", err);
  });
}

module.exports = { bookAppointment, getMyAppointments, getDoctorAppointments, cancelAppointment };

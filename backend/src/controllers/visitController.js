const visitService = require("../services/visitService");
const aiService = require("../services/aiService");
const googleCalendarService = require("../services/googleCalendarService");
const AppError = require("../utils/AppError");

async function submitVisit(req, res) {
  const appointmentId = Number(req.params.appointmentId);
  if (!Number.isInteger(appointmentId)) {
    throw new AppError("Invalid appointment id", 400);
  }

  const appointment = await visitService.submitVisit(req.user.id, appointmentId, req.body);
  res.status(200).json({ appointment });

  // Same fire-and-forget pattern as Phase 5: never await, never let a
  // Gemini or Google Calendar failure affect the note-submission response
  // already sent.
  aiService.generateAndStorePatientSummary(appointment).catch((err) => {
    console.error("Unexpected error in patient summary generation:", err);
  });
  googleCalendarService.updateEventForCompletedVisit(appointment).catch((err) => {
    console.error("Unexpected error updating Google Calendar event:", err);
  });
}

module.exports = { submitVisit };

const startAppointmentReminderJob = require("./appointmentReminderJob");
const startMedicationReminderJob = require("./medicationReminderJob");

function startScheduledJobs() {
  startAppointmentReminderJob();
  startMedicationReminderJob();
  console.log("Scheduled jobs started: appointment reminders (08:00 UTC), medication reminders (09:00 UTC).");
}

module.exports = startScheduledJobs;

const cron = require("node-cron");
const reminderService = require("../services/reminderService");

function startAppointmentReminderJob() {
  cron.schedule(
    "0 8 * * *",
    () => {
      reminderService.sendDailyAppointmentReminders().catch((err) => {
        console.error("Unexpected error in appointment reminder job:", err);
      });
    },
    { timezone: "UTC", noOverlap: true }
  );
}

module.exports = startAppointmentReminderJob;

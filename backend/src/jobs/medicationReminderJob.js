const cron = require("node-cron");
const reminderService = require("../services/reminderService");
function startMedicationReminderJob() {
  cron.schedule(
    "0 9 * * *",
    () => {
      reminderService.sendDailyMedicationReminders().catch((err) => {
        console.error("Unexpected error in medication reminder job:", err);
      });
    },
    { timezone: "UTC", noOverlap: true }
  );
}

module.exports = startMedicationReminderJob;

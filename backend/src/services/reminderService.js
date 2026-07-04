const prisma = require("../config/prisma");
const notificationService = require("./notificationService");
const { todayDateOnlyUTC } = require("../utils/timeUtils");

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
async function sendDailyAppointmentReminders() {
  const tomorrow = addDays(todayDateOnlyUTC(), 1);

  const appointments = await prisma.appointment.findMany({
    where: { date: tomorrow, cancelledAt: null, reminderSentAt: null },
  });

  console.log(
    `Appointment reminder job: ${appointments.length} appointment(s) to remind for ${tomorrow.toISOString().split("T")[0]}`
  );

  for (const appointment of appointments) {
    try {
      await notificationService.sendAppointmentReminderEmail(appointment);
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });
    } catch (err) {
      console.error(`Failed to process appointment reminder for appointment ${appointment.id}:`, err.message);
    }
  }
}
async function sendDailyMedicationReminders() {
  const today = todayDateOnlyUTC();

  const prescriptions = await prisma.prescription.findMany({
    where: {
      appointment: { completedAt: { not: null }, cancelledAt: null },
      OR: [{ lastReminderSentAt: null }, { lastReminderSentAt: { lt: today } }],
    },
    include: { appointment: true },
  });

  const activeByPatient = new Map();
  for (const prescription of prescriptions) {
    const start = prescription.appointment.date;
    const end = addDays(start, prescription.durationDays - 1);
    if (today >= start && today <= end) {
      const list = activeByPatient.get(prescription.appointment.patientId) || [];
      list.push(prescription);
      activeByPatient.set(prescription.appointment.patientId, list);
    }
  }

  console.log(`Medication reminder job: ${activeByPatient.size} patient(s) with active medication today`);

  for (const [patientId, activePrescriptions] of activeByPatient) {
    try {
      const patient = await prisma.user.findUnique({ where: { id: patientId } });
      if (!patient) continue;

      await notificationService.sendMedicationReminderEmail(patient, activePrescriptions);

      await prisma.prescription.updateMany({
        where: { id: { in: activePrescriptions.map((p) => p.id) } },
        data: { lastReminderSentAt: new Date() },
      });
    } catch (err) {
      console.error(`Failed to process medication reminders for patient ${patientId}:`, err.message);
    }
  }
}

module.exports = { sendDailyAppointmentReminders, sendDailyMedicationReminders };

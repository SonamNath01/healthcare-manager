const nodemailer = require("nodemailer");
const { getTransporter } = require("../config/mailer");
const prisma = require("../config/prisma");
const { formatDateOnly } = require("../utils/timeUtils");

const FROM_ADDRESS = process.env.EMAIL_FROM || "no-reply@healthcare-manager.local";

async function sendMail({ to, subject, text }) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: FROM_ADDRESS, to, subject, text });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email preview ("${subject}" to ${to}): ${previewUrl}`);
    }
  } catch (err) {
    console.error(`Failed to send email to ${to} ("${subject}"):`, err.message);
  }
}

async function loadPatientAndDoctor(appointment) {
  const [patient, doctor] = await Promise.all([
    prisma.user.findUnique({ where: { id: appointment.patientId } }),
    prisma.doctor.findUnique({ where: { id: appointment.doctorId }, include: { user: true } }),
  ]);
  return { patient, doctor };
}

async function sendBookingConfirmationEmail(appointment) {
  const { patient, doctor } = await loadPatientAndDoctor(appointment);
  if (!patient || !doctor) return;

  await sendMail({
    to: patient.email,
    subject: "Your appointment is confirmed",
    text:
      `Hi ${patient.name},\n\n` +
      `Your appointment with ${doctor.user.name} (${doctor.specialization}) is confirmed for ` +
      `${formatDateOnly(appointment.date)} at ${appointment.startTime}.\n\nSee you then!`,
  });
}

async function sendCancellationEmail(appointment) {
  const { patient, doctor } = await loadPatientAndDoctor(appointment);
  if (!patient || !doctor) return;

  await sendMail({
    to: patient.email,
    subject: "Your appointment has been cancelled",
    text:
      `Hi ${patient.name},\n\n` +
      `Your appointment with ${doctor.user.name} scheduled for ` +
      `${formatDateOnly(appointment.date)} at ${appointment.startTime} has been cancelled.`,
  });
}

async function sendAppointmentReminderEmail(appointment) {
  const { patient, doctor } = await loadPatientAndDoctor(appointment);
  if (!patient || !doctor) return;

  await sendMail({
    to: patient.email,
    subject: "Reminder: appointment tomorrow",
    text:
      `Hi ${patient.name},\n\n` +
      `This is a reminder that you have an appointment with ${doctor.user.name} tomorrow ` +
      `(${formatDateOnly(appointment.date)}) at ${appointment.startTime}.`,
  });
}

async function sendMedicationReminderEmail(patient, prescriptions) {
  const lines = prescriptions
    .map((p) => `- ${p.medicineName} ${p.dosage}, ${p.frequency}` + (p.instructions ? ` (${p.instructions})` : ""))
    .join("\n");

  await sendMail({
    to: patient.email,
    subject: "Medication reminder",
    text: `Hi ${patient.name},\n\nThis is a reminder to take your medication today:\n\n${lines}\n\nStay well!`,
  });
}

module.exports = {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendAppointmentReminderEmail,
  sendMedicationReminderEmail,
};

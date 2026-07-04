const { google } = require("googleapis");
const { createOAuthClient } = require("../config/googleOAuthClient");
const prisma = require("../config/prisma");
const { formatDateOnly } = require("../utils/timeUtils");

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getAuthUrl(doctorId) {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: String(doctorId),
  });
}

async function handleOAuthCallback(code, doctorId) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh token returned by Google. This can happen if the doctor already granted consent before " +
        "without revoking it -- Google only issues a refresh token on the first consent, or when prompt=consent forces it."
    );
  }

  await prisma.doctor.update({
    where: { id: doctorId },
    data: { googleRefreshToken: tokens.refresh_token },
  });
}

function getAuthorizedClient(doctor) {
  if (!doctor.googleRefreshToken) {
    return null;
  }
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: doctor.googleRefreshToken });
  return client;
}

function buildEventResource(appointment, patient) {
  const dateStr = formatDateOnly(appointment.date);
  return {
    summary: `Appointment: ${patient.name}`,
    description: appointment.reasonForVisit
      ? `Reason for visit: ${appointment.reasonForVisit}`
      : "Booked via Healthcare Manager",
    start: { dateTime: `${dateStr}T${appointment.startTime}:00`, timeZone: "UTC" },
    end: { dateTime: `${dateStr}T${appointment.endTime}:00`, timeZone: "UTC" },
  };
}
async function createEventForAppointment(appointment) {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });
    const authClient = doctor && getAuthorizedClient(doctor);
    if (!authClient) return;

    const patient = await prisma.user.findUnique({ where: { id: appointment.patientId } });
    if (!patient) return;

    const calendar = google.calendar({ version: "v3", auth: authClient });
    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: buildEventResource(appointment, patient),
    });

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { googleCalendarEventId: data.id },
    });
  } catch (err) {
    console.error(`Google Calendar event creation failed for appointment ${appointment.id}:`, err.message);
  }
}

async function updateEventForCompletedVisit(appointment) {
  try {
    if (!appointment.googleCalendarEventId) return;

    const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });
    const authClient = doctor && getAuthorizedClient(doctor);
    if (!authClient) return;

    const calendar = google.calendar({ version: "v3", auth: authClient });
    await calendar.events.patch({
      calendarId: "primary",
      eventId: appointment.googleCalendarEventId,
      requestBody: {
        description: `Visit completed.\n\nNotes: ${appointment.doctorNotes || "(none)"}`,
      },
    });
  } catch (err) {
    console.error(`Google Calendar event update failed for appointment ${appointment.id}:`, err.message);
  }
}

async function deleteEventForAppointment(appointment) {
  try {
    if (!appointment.googleCalendarEventId) return;

    const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });
    const authClient = doctor && getAuthorizedClient(doctor);
    if (!authClient) return;

    const calendar = google.calendar({ version: "v3", auth: authClient });
    await calendar.events.delete({
      calendarId: "primary",
      eventId: appointment.googleCalendarEventId,
    });
  } catch (err) {
    console.error(`Google Calendar event deletion failed for appointment ${appointment.id}:`, err.message);
  }
}

module.exports = {
  getAuthUrl,
  handleOAuthCallback,
  createEventForAppointment,
  updateEventForCompletedVisit,
  deleteEventForAppointment,
};

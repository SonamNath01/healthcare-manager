const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { TIME_REGEX, timeToMinutes, minutesToTime, parseDateOnly, isPastDate } = require("../utils/timeUtils");

async function bookAppointment(patientId, { doctorId, date: dateStr, startTime, reasonForVisit }) {
  if (!doctorId || !dateStr || !startTime) {
    throw new AppError("doctorId, date, and startTime are required", 400);
  }
  if (!Number.isInteger(doctorId)) {
    throw new AppError("doctorId must be an integer", 400);
  }
  if (!TIME_REGEX.test(startTime)) {
    throw new AppError("startTime must be in HH:mm 24-hour format", 400);
  }

  const date = parseDateOnly(dateStr);
  if (!date) {
    throw new AppError("date must be in YYYY-MM-DD format", 400);
  }
  if (isPastDate(date)) {
    throw new AppError("Cannot book an appointment in the past", 400);
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const dayOfWeek = date.getUTCDay();
  const workingHour = await prisma.workingHour.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });
  if (!workingHour) {
    throw new AppError("Doctor does not work on this day", 400);
  }

  const startMinutes = timeToMinutes(startTime);
  const workStart = timeToMinutes(workingHour.startTime);
  const workEnd = timeToMinutes(workingHour.endTime);
  const isOnSlotBoundary = (startMinutes - workStart) % doctor.slotDurationMinutes === 0;

  if (startMinutes < workStart || startMinutes + doctor.slotDurationMinutes > workEnd || !isOnSlotBoundary) {
    throw new AppError("Requested time is not a valid slot for this doctor", 400);
  }

  const onLeave = await prisma.leave.findUnique({
    where: { doctorId_date: { doctorId, date } },
  });
  if (onLeave) {
    throw new AppError("Doctor is on leave on this date", 400);
  }

  const endTime = minutesToTime(startMinutes + doctor.slotDurationMinutes);

  try {
    return await prisma.appointment.create({
      data: { doctorId, patientId, date, startTime, endTime, reasonForVisit },
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new AppError("This slot has just been booked by someone else. Please choose another.", 409);
    }
    throw err;
  }
}

const PATIENT_APPOINTMENT_SELECT = {
  id: true,
  doctorId: true,
  patientId: true,
  date: true,
  startTime: true,
  endTime: true,
  createdAt: true,
  reasonForVisit: true,
  completedAt: true,
  cancelledAt: true,
  patientSummary: true,
  patientSummaryGeneratedAt: true,
  doctor: {
    select: { id: true, specialization: true, user: { select: { name: true } } },
  },
  prescriptions: true,
};

async function getMyAppointments(patientId) {
  return prisma.appointment.findMany({
    where: { patientId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: PATIENT_APPOINTMENT_SELECT,
  });
}

async function getDoctorAppointments(doctorUserId) {
  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) {
    throw new AppError("No doctor profile found for this account", 404);
  }

  return prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      patient: { select: { id: true, name: true, email: true } },
      prescriptions: true,
    },
  });
}
async function cancelAppointment(patientId, appointmentId) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }
  if (appointment.patientId !== patientId) {
    throw new AppError("You can only cancel your own appointments", 403);
  }
  if (appointment.cancelledAt) {
    throw new AppError("This appointment is already cancelled", 409);
  }
  if (appointment.completedAt) {
    throw new AppError("Cannot cancel a completed visit", 400);
  }
  if (isPastDate(appointment.date)) {
    throw new AppError("Cannot cancel a past appointment", 400);
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { cancelledAt: new Date() },
  });
}

module.exports = { bookAppointment, getMyAppointments, getDoctorAppointments, cancelAppointment };

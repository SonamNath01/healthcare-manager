const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const {
  TIME_REGEX,
  timeToMinutes,
  minutesToTime,
  parseDateOnly,
  isPastDate,
} = require("../utils/timeUtils");

const DOCTOR_SELECT = {
  id: true,
  specialization: true,
  slotDurationMinutes: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, email: true, role: true },
  },
};

const PUBLIC_DOCTOR_SELECT = {
  id: true,
  specialization: true,
  slotDurationMinutes: true,
  user: { select: { name: true } },
};

async function createDoctor({ name, email, password, specialization }) {
  if (!name || !email || !password || !specialization) {
    throw new AppError("name, email, password, and specialization are required", 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, password: hashedPassword, role: "DOCTOR" },
    });

    return tx.doctor.create({
      data: { userId: user.id, specialization },
      select: DOCTOR_SELECT,
    });
  });
}

async function listDoctors() {
  return prisma.doctor.findMany({ select: DOCTOR_SELECT, orderBy: { id: "asc" } });
}

async function getDoctorById(doctorId) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: {
      ...DOCTOR_SELECT,
      workingHours: { orderBy: { dayOfWeek: "asc" } },
      leaves: { orderBy: { date: "asc" } },
    },
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return doctor;
}

async function updateDoctor(doctorId, { name, specialization }) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    if (name) {
      await tx.user.update({ where: { id: doctor.userId }, data: { name } });
    }

    return tx.doctor.update({
      where: { id: doctorId },
      data: specialization ? { specialization } : {},
      select: DOCTOR_SELECT,
    });
  });
}
async function setWorkingHours(doctorId, workingHours) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (!Array.isArray(workingHours) || workingHours.length === 0) {
    throw new AppError("workingHours must be a non-empty array", 400);
  }

  const seenDays = new Set();
  for (const entry of workingHours) {
    const { dayOfWeek, startTime, endTime } = entry;

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new AppError("dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)", 400);
    }
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      throw new AppError("startTime and endTime must be in HH:mm 24-hour format", 400);
    }
    if (startTime >= endTime) {
      throw new AppError("startTime must be before endTime", 400);
    }
    if (seenDays.has(dayOfWeek)) {
      throw new AppError(`Duplicate dayOfWeek ${dayOfWeek} in request`, 400);
    }
    seenDays.add(dayOfWeek);
  }

  await prisma.$transaction([
    prisma.workingHour.deleteMany({ where: { doctorId } }),
    prisma.workingHour.createMany({
      data: workingHours.map(({ dayOfWeek, startTime, endTime }) => ({
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
      })),
    }),
  ]);

  return prisma.workingHour.findMany({ where: { doctorId }, orderBy: { dayOfWeek: "asc" } });
}

async function addLeave(doctorId, { startDate, endDate, reason }) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (!startDate) {
    throw new AppError("startDate is required", 400);
  }

  const start = parseDateOnly(startDate);
  if (!start) {
    throw new AppError("startDate must be in YYYY-MM-DD format", 400);
  }
  const end = endDate ? parseDateOnly(endDate) : start;
  if (!end) {
    throw new AppError("endDate must be in YYYY-MM-DD format", 400);
  }
  if (start > end) {
    throw new AppError("startDate must be before or equal to endDate", 400);
  }

  const dates = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(new Date(d));
  }

  await prisma.$transaction(
    dates.map((date) =>
      prisma.leave.upsert({
        where: { doctorId_date: { doctorId, date } },
        update: { reason },
        create: { doctorId, date, reason },
      })
    )
  );

  return prisma.leave.findMany({ where: { doctorId }, orderBy: { date: "asc" } });
}

async function searchDoctors({ specialization }) {
  return prisma.doctor.findMany({
    where: specialization
      ? { specialization: { contains: specialization, mode: "insensitive" } }
      : undefined,
    select: PUBLIC_DOCTOR_SELECT,
    orderBy: { id: "asc" },
  });
}

async function getAvailableSlots(doctorId, dateStr) {
  const date = parseDateOnly(dateStr);
  if (!date) {
    throw new AppError("date query param is required in YYYY-MM-DD format", 400);
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (isPastDate(date)) {
    return [];
  }

  const dayOfWeek = date.getUTCDay();
  const workingHour = await prisma.workingHour.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });
  if (!workingHour) {
    return [];
  }

  const onLeave = await prisma.leave.findUnique({
    where: { doctorId_date: { doctorId, date } },
  });
  if (onLeave) {
    return [];
  }

  const existingAppointments = await prisma.appointment.findMany({
    where: { doctorId, date, cancelledAt: null },
    select: { startTime: true },
  });
  const bookedTimes = new Set(existingAppointments.map((a) => a.startTime));

  const slots = [];
  const workEnd = timeToMinutes(workingHour.endTime);
  for (
    let minutes = timeToMinutes(workingHour.startTime);
    minutes + doctor.slotDurationMinutes <= workEnd;
    minutes += doctor.slotDurationMinutes
  ) {
    const slotStart = minutesToTime(minutes);
    if (!bookedTimes.has(slotStart)) {
      slots.push(slotStart);
    }
  }

  return slots;
}

async function deleteLeave(doctorId, leaveId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
  if (!leave || leave.doctorId !== doctorId) {
    throw new AppError("Leave not found", 404);
  }

  await prisma.leave.delete({ where: { id: leaveId } });
}

module.exports = {
  createDoctor,
  listDoctors,
  getDoctorById,
  updateDoctor,
  setWorkingHours,
  addLeave,
  deleteLeave,
  searchDoctors,
  getAvailableSlots,
};

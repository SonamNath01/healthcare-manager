const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { todayDateOnlyUTC } = require("../utils/timeUtils");

function validatePrescriptions(prescriptions) {
  for (const p of prescriptions) {
    if (!p.medicineName || !p.dosage || !p.frequency || !Number.isInteger(p.durationDays) || p.durationDays <= 0) {
      throw new AppError(
        "Each prescription needs medicineName, dosage, frequency, and a positive integer durationDays",
        400
      );
    }
  }
}
async function submitVisit(doctorUserId, appointmentId, { notes, prescriptions }) {
  if (!notes) {
    throw new AppError("notes is required", 400);
  }

  const prescriptionList = prescriptions ?? [];
  if (!Array.isArray(prescriptionList)) {
    throw new AppError("prescriptions must be an array", 400);
  }
  validatePrescriptions(prescriptionList);

  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) {
    throw new AppError("No doctor profile found for this account", 404);
  }

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.doctorId !== doctor.id) {
    throw new AppError("You can only submit notes for your own appointments", 403);
  }

  if (appointment.completedAt) {
    throw new AppError("This visit has already been completed", 409);
  }

  if (appointment.date > todayDateOnlyUTC()) {
    throw new AppError("Cannot submit visit notes for a future appointment", 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointmentId },
      data: { doctorNotes: notes, completedAt: new Date() },
    });

    if (prescriptionList.length > 0) {
      await tx.prescription.createMany({
        data: prescriptionList.map(({ medicineName, dosage, frequency, durationDays, instructions }) => ({
          medicineName,
          dosage,
          frequency,
          durationDays,
          instructions,
          appointmentId,
        })),
      });
    }

    return tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { prescriptions: true },
    });
  });
}

module.exports = { submitVisit };

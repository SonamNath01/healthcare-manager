-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3);

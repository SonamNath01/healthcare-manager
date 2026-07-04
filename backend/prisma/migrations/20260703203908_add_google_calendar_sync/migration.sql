-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "googleCalendarEventId" TEXT;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "googleRefreshToken" TEXT;

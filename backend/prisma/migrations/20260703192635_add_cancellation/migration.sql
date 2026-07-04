-- DropIndex
DROP INDEX "Appointment_doctorId_date_startTime_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Appointment_doctorId_date_startTime_idx" ON "Appointment"("doctorId", "date", "startTime");

-- CreateIndex (hand-written: Prisma's schema language can't express a
-- partial/conditional unique index. This is the actual safety net against
-- double-booking an active slot -- a cancelled appointment (cancelledAt IS
-- NOT NULL) no longer counts toward the uniqueness check, so its slot
-- becomes bookable again.)
CREATE UNIQUE INDEX "Appointment_doctorId_date_startTime_active_key"
ON "Appointment"("doctorId", "date", "startTime")
WHERE "cancelledAt" IS NULL;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "aiGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "aiSuggestedQuestions" TEXT[],
ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "aiUrgency" TEXT,
ADD COLUMN     "reasonForVisit" TEXT;

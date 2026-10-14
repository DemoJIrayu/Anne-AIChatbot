-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "confidenceThreshold" DOUBLE PRECISION DEFAULT 0.7,
ADD COLUMN     "fallbackMessage" TEXT,
ADD COLUMN     "replyTone" TEXT,
ADD COLUMN     "systemPrompt" TEXT;

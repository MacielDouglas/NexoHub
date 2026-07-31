/*
  Warnings:

  - You are about to drop the column `durationMinutes` on the `MeetingConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MeetingConfig" DROP COLUMN "durationMinutes";

-- CreateTable
CREATE TABLE "SpecialEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "time" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialEvent_organizationId_type_idx" ON "SpecialEvent"("organizationId", "type");

-- AddForeignKey
ALTER TABLE "SpecialEvent" ADD CONSTRAINT "SpecialEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

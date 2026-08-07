-- AlterTable
ALTER TABLE "MeetingConfig" ADD COLUMN     "defaultSentinelaConductorId" TEXT;

-- AddForeignKey
ALTER TABLE "MeetingConfig" ADD CONSTRAINT "MeetingConfig_defaultSentinelaConductorId_fkey" FOREIGN KEY ("defaultSentinelaConductorId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

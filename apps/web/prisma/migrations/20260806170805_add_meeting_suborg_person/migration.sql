-- AlterTable
ALTER TABLE "MeetingAssignment" ADD COLUMN     "subOrgPersonId" TEXT;

-- CreateIndex
CREATE INDEX "MeetingAssignment_subOrgPersonId_idx" ON "MeetingAssignment"("subOrgPersonId");

-- AddForeignKey
ALTER TABLE "MeetingAssignment" ADD CONSTRAINT "MeetingAssignment_subOrgPersonId_fkey" FOREIGN KEY ("subOrgPersonId") REFERENCES "SubOrgPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

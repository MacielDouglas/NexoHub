-- CreateTable
CREATE TABLE "SubOrgPersonTalk" (
    "id" TEXT NOT NULL,
    "subOrgPersonId" TEXT NOT NULL,
    "meetingContentItemId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrgPersonTalk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubOrgPersonTalk_subOrgPersonId_idx" ON "SubOrgPersonTalk"("subOrgPersonId");

-- CreateIndex
CREATE INDEX "SubOrgPersonTalk_meetingContentItemId_idx" ON "SubOrgPersonTalk"("meetingContentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SubOrgPersonTalk_subOrgPersonId_meetingContentItemId_key" ON "SubOrgPersonTalk"("subOrgPersonId", "meetingContentItemId");

-- AddForeignKey
ALTER TABLE "SubOrgPersonTalk" ADD CONSTRAINT "SubOrgPersonTalk_subOrgPersonId_fkey" FOREIGN KEY ("subOrgPersonId") REFERENCES "SubOrgPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrgPersonTalk" ADD CONSTRAINT "SubOrgPersonTalk_meetingContentItemId_fkey" FOREIGN KEY ("meetingContentItemId") REFERENCES "MeetingContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

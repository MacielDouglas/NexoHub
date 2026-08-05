-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAssignment" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "personId" TEXT,
    "contentItemId" TEXT,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meeting_organizationId_weekStart_idx" ON "Meeting"("organizationId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_organizationId_type_weekStart_key" ON "Meeting"("organizationId", "type", "weekStart");

-- CreateIndex
CREATE INDEX "MeetingAssignment_meetingId_idx" ON "MeetingAssignment"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingAssignment_personId_idx" ON "MeetingAssignment"("personId");

-- CreateIndex
CREATE INDEX "MeetingAssignment_contentItemId_idx" ON "MeetingAssignment"("contentItemId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAssignment" ADD CONSTRAINT "MeetingAssignment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAssignment" ADD CONSTRAINT "MeetingAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAssignment" ADD CONSTRAINT "MeetingAssignment_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "MeetingContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

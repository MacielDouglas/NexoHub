-- CreateTable
CREATE TABLE "MeetingConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'midweek',
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingPart" (
    "id" TEXT NOT NULL,
    "meetingConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "sortOrder" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingPart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingConfig_organizationId_type_key" ON "MeetingConfig"("organizationId", "type");

-- AddForeignKey
ALTER TABLE "MeetingConfig" ADD CONSTRAINT "MeetingConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingPart" ADD CONSTRAINT "MeetingPart_meetingConfigId_fkey" FOREIGN KEY ("meetingConfigId") REFERENCES "MeetingConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

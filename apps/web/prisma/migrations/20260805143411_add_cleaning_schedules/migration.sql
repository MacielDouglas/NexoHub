-- CreateTable
CREATE TABLE "CleaningSchedule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningAssignment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sectorId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CleaningSchedule_organizationId_type_idx" ON "CleaningSchedule"("organizationId", "type");

-- CreateIndex
CREATE INDEX "CleaningSchedule_organizationId_startDate_endDate_idx" ON "CleaningSchedule"("organizationId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "CleaningAssignment_scheduleId_idx" ON "CleaningAssignment"("scheduleId");

-- CreateIndex
CREATE INDEX "CleaningAssignment_date_idx" ON "CleaningAssignment"("date");

-- CreateIndex
CREATE INDEX "CleaningAssignment_sectorId_idx" ON "CleaningAssignment"("sectorId");

-- CreateIndex
CREATE INDEX "CleaningAssignment_personId_idx" ON "CleaningAssignment"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CleaningAssignment_scheduleId_date_sectorId_personId_key" ON "CleaningAssignment"("scheduleId", "date", "sectorId", "personId");

-- AddForeignKey
ALTER TABLE "CleaningSchedule" ADD CONSTRAINT "CleaningSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignment" ADD CONSTRAINT "CleaningAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "CleaningSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignment" ADD CONSTRAINT "CleaningAssignment_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "CleaningSector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignment" ADD CONSTRAINT "CleaningAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DesignationConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "micCount" INTEGER NOT NULL DEFAULT 1,
    "indicadorCount" INTEGER NOT NULL DEFAULT 1,
    "indicadorSectors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignationProgram" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignationAssignment" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL,
    "sector" TEXT,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignationConfig_organizationId_key" ON "DesignationConfig"("organizationId");

-- CreateIndex
CREATE INDEX "DesignationProgram_organizationId_startDate_endDate_idx" ON "DesignationProgram"("organizationId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "DesignationAssignment_programId_idx" ON "DesignationAssignment"("programId");

-- CreateIndex
CREATE INDEX "DesignationAssignment_date_idx" ON "DesignationAssignment"("date");

-- CreateIndex
CREATE INDEX "DesignationAssignment_personId_idx" ON "DesignationAssignment"("personId");

-- AddForeignKey
ALTER TABLE "DesignationConfig" ADD CONSTRAINT "DesignationConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignationProgram" ADD CONSTRAINT "DesignationProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignationAssignment" ADD CONSTRAINT "DesignationAssignment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "DesignationProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignationAssignment" ADD CONSTRAINT "DesignationAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

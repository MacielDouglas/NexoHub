-- CreateTable
CREATE TABLE "CleaningConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "weeklyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDayOfWeek" INTEGER,
    "weeklyIntervalWeeks" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningSector" (
    "id" TEXT NOT NULL,
    "cleaningConfigId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "defaultKey" TEXT,
    "name" TEXT,
    "task" TEXT,
    "unit" TEXT NOT NULL,
    "peopleCount" INTEGER,
    "allowYoung" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT NOT NULL DEFAULT 'any',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningSector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CleaningConfig_organizationId_key" ON "CleaningConfig"("organizationId");

-- CreateIndex
CREATE INDEX "CleaningSector_cleaningConfigId_type_idx" ON "CleaningSector"("cleaningConfigId", "type");

-- AddForeignKey
ALTER TABLE "CleaningConfig" ADD CONSTRAINT "CleaningConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningSector" ADD CONSTRAINT "CleaningSector_cleaningConfigId_fkey" FOREIGN KEY ("cleaningConfigId") REFERENCES "CleaningConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

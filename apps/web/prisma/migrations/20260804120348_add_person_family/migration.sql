-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chefeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "young" BOOLEAN NOT NULL DEFAULT false,
    "batizado" BOOLEAN NOT NULL DEFAULT false,
    "limpeza" BOOLEAN NOT NULL DEFAULT true,
    "estudante" BOOLEAN NOT NULL DEFAULT true,
    "privilegioServico" BOOLEAN NOT NULL DEFAULT false,
    "chefeFamilia" BOOLEAN NOT NULL DEFAULT false,
    "casada" BOOLEAN NOT NULL DEFAULT false,
    "familyId" TEXT,
    "iniciarConversas" BOOLEAN NOT NULL DEFAULT false,
    "cultivarInteresse" BOOLEAN NOT NULL DEFAULT false,
    "fazerDiscipulos" BOOLEAN NOT NULL DEFAULT false,
    "explicarCrencas" BOOLEAN NOT NULL DEFAULT false,
    "leituraBiblia" BOOLEAN NOT NULL DEFAULT false,
    "microfoneVolante" BOOLEAN NOT NULL DEFAULT false,
    "som" BOOLEAN NOT NULL DEFAULT false,
    "video" BOOLEAN NOT NULL DEFAULT false,
    "palco" BOOLEAN NOT NULL DEFAULT false,
    "leitorEstudoBiblico" BOOLEAN NOT NULL DEFAULT false,
    "leitorSentinela" BOOLEAN NOT NULL DEFAULT false,
    "indicador" BOOLEAN NOT NULL DEFAULT false,
    "oracao" BOOLEAN NOT NULL DEFAULT false,
    "anciao" BOOLEAN NOT NULL DEFAULT false,
    "presidenteVidaMinisterio" BOOLEAN NOT NULL DEFAULT false,
    "discursoTesouros" BOOLEAN NOT NULL DEFAULT false,
    "joiasEspirituais" BOOLEAN NOT NULL DEFAULT false,
    "nossaVidaCrista" BOOLEAN NOT NULL DEFAULT false,
    "necessidadesLocais" BOOLEAN NOT NULL DEFAULT false,
    "condutorEstudoBiblico" BOOLEAN NOT NULL DEFAULT false,
    "presidenteFimSemana" BOOLEAN NOT NULL DEFAULT false,
    "discursoPublico" BOOLEAN NOT NULL DEFAULT false,
    "condutorSentinela" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_chefeId_key" ON "Family"("chefeId");

-- CreateIndex
CREATE INDEX "Family_organizationId_idx" ON "Family"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Family_organizationId_name_key" ON "Family"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_userId_key" ON "Person"("userId");

-- CreateIndex
CREATE INDEX "Person_organizationId_sex_idx" ON "Person"("organizationId", "sex");

-- CreateIndex
CREATE INDEX "Person_organizationId_active_idx" ON "Person"("organizationId", "active");

-- CreateIndex
CREATE INDEX "Person_familyId_idx" ON "Person"("familyId");

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_chefeId_fkey" FOREIGN KEY ("chefeId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

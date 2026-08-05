-- CreateTable
CREATE TABLE "PersonTalk" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "meetingContentItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonTalk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalkDate" (
    "id" TEXT NOT NULL,
    "personTalkId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalkDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrganization" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrgPerson" (
    "id" TEXT NOT NULL,
    "subOrganizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "batizado" BOOLEAN NOT NULL DEFAULT false,
    "privilegioServico" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrgPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonTalk_personId_idx" ON "PersonTalk"("personId");

-- CreateIndex
CREATE INDEX "PersonTalk_meetingContentItemId_idx" ON "PersonTalk"("meetingContentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonTalk_personId_meetingContentItemId_key" ON "PersonTalk"("personId", "meetingContentItemId");

-- CreateIndex
CREATE INDEX "TalkDate_personTalkId_idx" ON "TalkDate"("personTalkId");

-- CreateIndex
CREATE INDEX "TalkDate_date_idx" ON "TalkDate"("date");

-- CreateIndex
CREATE INDEX "SubOrganization_organizationId_idx" ON "SubOrganization"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SubOrganization_organizationId_name_key" ON "SubOrganization"("organizationId", "name");

-- CreateIndex
CREATE INDEX "SubOrgPerson_subOrganizationId_idx" ON "SubOrgPerson"("subOrganizationId");

-- AddForeignKey
ALTER TABLE "PersonTalk" ADD CONSTRAINT "PersonTalk_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonTalk" ADD CONSTRAINT "PersonTalk_meetingContentItemId_fkey" FOREIGN KEY ("meetingContentItemId") REFERENCES "MeetingContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkDate" ADD CONSTRAINT "TalkDate_personTalkId_fkey" FOREIGN KEY ("personTalkId") REFERENCES "PersonTalk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrganization" ADD CONSTRAINT "SubOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrgPerson" ADD CONSTRAINT "SubOrgPerson_subOrganizationId_fkey" FOREIGN KEY ("subOrganizationId") REFERENCES "SubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

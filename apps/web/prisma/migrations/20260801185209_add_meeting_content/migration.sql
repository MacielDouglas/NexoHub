-- CreateTable
CREATE TABLE "MeetingContent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "symbol" TEXT,
    "coverTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingContentItem" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingContent_organizationId_type_idx" ON "MeetingContent"("organizationId", "type");

-- CreateIndex
CREATE INDEX "MeetingContentItem_contentId_idx" ON "MeetingContentItem"("contentId");

-- AddForeignKey
ALTER TABLE "MeetingContent" ADD CONSTRAINT "MeetingContent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingContentItem" ADD CONSTRAINT "MeetingContentItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "MeetingContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

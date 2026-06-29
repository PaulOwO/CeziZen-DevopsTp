-- AlterTable
ALTER TABLE "BreathingPreset" ADD COLUMN     "createdById" INTEGER;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "createdById" INTEGER;

-- CreateTable
CREATE TABLE "PageConsultation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pageId" INTEGER NOT NULL,
    "consultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageConsultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreathingSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "breathingPresetId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BreathingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageConsultation_userId_pageId_key" ON "PageConsultation"("userId", "pageId");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreathingPreset" ADD CONSTRAINT "BreathingPreset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageConsultation" ADD CONSTRAINT "PageConsultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageConsultation" ADD CONSTRAINT "PageConsultation_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreathingSession" ADD CONSTRAINT "BreathingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreathingSession" ADD CONSTRAINT "BreathingSession_breathingPresetId_fkey" FOREIGN KEY ("breathingPresetId") REFERENCES "BreathingPreset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

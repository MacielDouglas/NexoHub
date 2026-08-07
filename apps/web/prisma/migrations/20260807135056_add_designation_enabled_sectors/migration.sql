-- AlterTable
ALTER TABLE "DesignationConfig" ADD COLUMN     "enabledSectors" JSONB;

-- AlterTable
ALTER TABLE "DesignationProgram" ADD COLUMN     "enabledSectors" JSONB;

/*
  Warnings:

  - You are about to drop the column `key` on the `Rule` table. All the data in the column will be lost.
  - You are about to drop the column `metrics` on the `Schedule` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `scope` on the `Policy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `Rule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Rule` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `value` on the `Rule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `RuleSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Policy_orgId_idx";

-- DropIndex
DROP INDEX "Policy_scope_wardId_scheduleId_isActive_idx";

-- DropIndex
DROP INDEX "Rule_ruleSetId_key_idx";

-- DropIndex
DROP INDEX "Schedule_wardId_idx";

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "scope",
ADD COLUMN     "scope" TEXT NOT NULL,
ALTER COLUMN "wardId" SET DATA TYPE TEXT,
ALTER COLUMN "scheduleId" SET DATA TYPE TEXT,
ALTER COLUMN "label" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Rule" DROP COLUMN "key",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "value",
ADD COLUMN     "value" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "RuleSet" ADD COLUMN     "maxConsecutiveNights" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "minRestHours" INTEGER NOT NULL DEFAULT 11,
ADD COLUMN     "oneShiftPerDay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "metrics",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "PolicyScope";

-- CreateIndex
CREATE UNIQUE INDEX "Policy_scope_orgId_wardId_scheduleId_key" ON "Policy"("scope", "orgId", "wardId", "scheduleId");

-- AddForeignKey
ALTER TABLE "Lock" ADD CONSTRAINT "Lock_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

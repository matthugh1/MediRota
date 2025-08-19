/*
  Warnings:

  - The `scope` column on the `RuleSet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `scope` column on the `ShiftType` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `scope` on the `Policy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "scope",
ADD COLUMN     "scope" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "RuleSet" DROP COLUMN "scope",
ADD COLUMN     "scope" VARCHAR(20);

-- AlterTable
ALTER TABLE "ShiftType" DROP COLUMN "scope",
ADD COLUMN     "scope" VARCHAR(20);

-- DropEnum
DROP TYPE "ScopeLevel";

-- CreateIndex
CREATE INDEX "Policy_scope_trustId_hospitalId_wardId_scheduleId_isActive_idx" ON "Policy"("scope", "trustId", "hospitalId", "wardId", "scheduleId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_scope_orgId_wardId_scheduleId_key" ON "Policy"("scope", "orgId", "wardId", "scheduleId");

-- CreateIndex
CREATE INDEX "RuleSet_scope_trustId_hospitalId_wardId_idx" ON "RuleSet"("scope", "trustId", "hospitalId", "wardId");

-- CreateIndex
CREATE INDEX "ShiftType_scope_trustId_hospitalId_wardId_idx" ON "ShiftType"("scope", "trustId", "hospitalId", "wardId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftType_scope_trustId_hospitalId_wardId_code_key" ON "ShiftType"("scope", "trustId", "hospitalId", "wardId", "code");

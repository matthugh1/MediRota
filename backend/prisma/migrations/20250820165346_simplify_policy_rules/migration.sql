/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the `PolicyRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RuleTemplate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[scope,orgId,wardId]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rules` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PolicyRule" DROP CONSTRAINT "PolicyRule_policyId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyRule" DROP CONSTRAINT "PolicyRule_ruleTemplateId_fkey";

-- DropIndex
DROP INDEX "Policy_scope_orgId_wardId_scheduleId_key";

-- DropIndex
DROP INDEX "Policy_scope_trustId_hospitalId_wardId_scheduleId_isActive_idx";

-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "scheduleId",
ADD COLUMN     "rules" JSONB NOT NULL;

-- DropTable
DROP TABLE "PolicyRule";

-- DropTable
DROP TABLE "RuleTemplate";

-- DropEnum
DROP TYPE "PolicyRuleKind";

-- CreateIndex
CREATE INDEX "Policy_scope_trustId_hospitalId_wardId_isActive_idx" ON "Policy"("scope", "trustId", "hospitalId", "wardId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_scope_orgId_wardId_key" ON "Policy"("scope", "orgId", "wardId");

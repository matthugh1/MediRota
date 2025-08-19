/*
  Warnings:

  - A unique constraint covering the columns `[scope,trustId,hospitalId,wardId,code]` on the table `ShiftType` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `scope` on the `Policy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ScopeLevel" AS ENUM ('TRUST', 'HOSPITAL', 'WARD', 'SCHEDULE');

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "hospitalId" UUID,
ADD COLUMN     "trustId" UUID,
DROP COLUMN "scope",
ADD COLUMN     "scope" "ScopeLevel" NOT NULL;

-- AlterTable
ALTER TABLE "RuleSet" ADD COLUMN     "hospitalId" UUID,
ADD COLUMN     "scope" "ScopeLevel",
ADD COLUMN     "trustId" UUID;

-- AlterTable
ALTER TABLE "ShiftType" ADD COLUMN     "hospitalId" UUID,
ADD COLUMN     "scope" "ScopeLevel",
ADD COLUMN     "trustId" UUID,
ADD COLUMN     "wardId" UUID;

-- AlterTable
ALTER TABLE "Ward" ADD COLUMN     "hospitalId" UUID;

-- CreateTable
CREATE TABLE "Trust" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trust_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "trustId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trust_name_key" ON "Trust"("name");

-- CreateIndex
CREATE INDEX "Hospital_trustId_idx" ON "Hospital"("trustId");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_trustId_name_key" ON "Hospital"("trustId", "name");

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

-- CreateIndex
CREATE INDEX "Ward_hospitalId_idx" ON "Ward"("hospitalId");

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_trustId_fkey" FOREIGN KEY ("trustId") REFERENCES "Trust"("id") ON DELETE SET NULL ON UPDATE CASCADE;

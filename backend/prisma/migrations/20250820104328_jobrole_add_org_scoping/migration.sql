/*
  Warnings:

  - A unique constraint covering the columns `[scope,trustId,hospitalId,code]` on the table `JobRole` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "JobRole_code_key";

-- AlterTable
ALTER TABLE "JobRole" ADD COLUMN     "hospitalId" UUID,
ADD COLUMN     "scope" VARCHAR(20),
ADD COLUMN     "trustId" UUID;

-- CreateIndex
CREATE INDEX "JobRole_scope_trustId_hospitalId_idx" ON "JobRole"("scope", "trustId", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "JobRole_scope_trustId_hospitalId_code_key" ON "JobRole"("scope", "trustId", "hospitalId", "code");

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_trustId_fkey" FOREIGN KEY ("trustId") REFERENCES "Trust"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[scope,orgId,wardId,scheduleId]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Policy_scope_orgId_wardId_scheduleId_key" ON "Policy"("scope", "orgId", "wardId", "scheduleId");

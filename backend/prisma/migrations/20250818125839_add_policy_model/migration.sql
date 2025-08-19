-- CreateEnum
CREATE TYPE "PolicyScope" AS ENUM ('ORG', 'WARD', 'SCHEDULE');

-- CreateTable
CREATE TABLE "Policy" (
    "id" UUID NOT NULL,
    "scope" "PolicyScope" NOT NULL,
    "orgId" TEXT,
    "wardId" VARCHAR(64),
    "scheduleId" VARCHAR(64),
    "weights" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "toggles" JSONB NOT NULL,
    "substitution" JSONB NOT NULL,
    "timeBudgetMs" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Policy_scope_wardId_scheduleId_isActive_idx" ON "Policy"("scope", "wardId", "scheduleId", "isActive");

-- CreateIndex
CREATE INDEX "Policy_orgId_idx" ON "Policy"("orgId");

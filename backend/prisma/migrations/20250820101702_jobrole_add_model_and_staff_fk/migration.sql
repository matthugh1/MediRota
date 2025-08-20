-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "jobRoleId" UUID;

-- CreateTable
CREATE TABLE "JobRole" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobRole_code_key" ON "JobRole"("code");

-- CreateIndex
CREATE INDEX "Staff_jobRoleId_idx" ON "Staff"("jobRoleId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

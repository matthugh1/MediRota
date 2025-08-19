/*
  Warnings:

  - Added the required column `jobId` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "jobId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_code_key" ON "Job"("code");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

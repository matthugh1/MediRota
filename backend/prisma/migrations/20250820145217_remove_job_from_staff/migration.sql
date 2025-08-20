/*
  Warnings:

  - You are about to drop the column `jobId` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `jobRoleId` on table `Staff` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_jobRoleId_fkey";

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "jobId",
ALTER COLUMN "jobRoleId" SET NOT NULL;

-- DropTable
DROP TABLE "Job";

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

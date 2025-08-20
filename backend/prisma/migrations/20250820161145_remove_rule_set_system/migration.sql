/*
  Warnings:

  - You are about to drop the `Rule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RuleSet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Rule" DROP CONSTRAINT "Rule_ruleSetId_fkey";

-- DropForeignKey
ALTER TABLE "RuleSet" DROP CONSTRAINT "RuleSet_wardId_fkey";

-- DropTable
DROP TABLE "Rule";

-- DropTable
DROP TABLE "RuleSet";

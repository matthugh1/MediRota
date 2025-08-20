-- CreateEnum
CREATE TYPE "PolicyRuleKind" AS ENUM ('HARD', 'SOFT');

-- CreateTable
CREATE TABLE "RuleTemplate" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "paramsSchema" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyRule" (
    "id" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "ruleTemplateId" UUID NOT NULL,
    "kind" "PolicyRuleKind" NOT NULL,
    "params" JSONB NOT NULL,
    "weight" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RuleTemplate_code_key" ON "RuleTemplate"("code");

-- CreateIndex
CREATE INDEX "RuleTemplate_code_idx" ON "RuleTemplate"("code");

-- CreateIndex
CREATE INDEX "PolicyRule_policyId_idx" ON "PolicyRule"("policyId");

-- CreateIndex
CREATE INDEX "PolicyRule_ruleTemplateId_idx" ON "PolicyRule"("ruleTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyRule_policyId_ruleTemplateId_key" ON "PolicyRule"("policyId", "ruleTemplateId");

-- AddForeignKey
ALTER TABLE "PolicyRule" ADD CONSTRAINT "PolicyRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyRule" ADD CONSTRAINT "PolicyRule_ruleTemplateId_fkey" FOREIGN KEY ("ruleTemplateId") REFERENCES "RuleTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "prefix" TEXT;

-- Add firstName and lastName columns with temporary default values
ALTER TABLE "Staff" ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE "Staff" ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT 'Staff';

-- Update existing records to split fullName into firstName and lastName
UPDATE "Staff" 
SET 
  "firstName" = CASE 
    WHEN "fullName" IS NULL OR "fullName" = '' THEN 'Unknown'
    WHEN POSITION(' ' IN "fullName") = 0 THEN "fullName"
    ELSE LEFT("fullName", POSITION(' ' IN "fullName") - 1)
  END,
  "lastName" = CASE 
    WHEN "fullName" IS NULL OR "fullName" = '' THEN 'Staff'
    WHEN POSITION(' ' IN "fullName") = 0 THEN 'Staff'
    ELSE SUBSTRING("fullName" FROM POSITION(' ' IN "fullName") + 1)
  END;

-- Remove the default values
ALTER TABLE "Staff" ALTER COLUMN "firstName" DROP DEFAULT;
ALTER TABLE "Staff" ALTER COLUMN "lastName" DROP DEFAULT;

-- Update fullName default
ALTER TABLE "Staff" ALTER COLUMN "fullName" SET DEFAULT '';

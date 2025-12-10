-- Migration: email_to_username
-- This migration converts the email field to username for existing users

-- Step 1: Add username column as nullable first
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Step 2: Populate username from email (use the part before @, or the full email if no @)
UPDATE "User" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

-- Step 3: Handle any duplicate usernames by appending row number
WITH duplicates AS (
  SELECT id, "username", ROW_NUMBER() OVER (PARTITION BY "username" ORDER BY "createdAt") as rn
  FROM "User"
)
UPDATE "User" 
SET "username" = "User"."username" || '_' || duplicates.rn::text
FROM duplicates 
WHERE "User".id = duplicates.id AND duplicates.rn > 1;

-- Step 4: Make username NOT NULL
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- Step 5: Drop old columns
ALTER TABLE "User" DROP COLUMN "email";
ALTER TABLE "User" DROP COLUMN "emailVerified";

-- Step 6: Create unique index on username
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Additive, nullable columns only — safe on live data.
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "courtCount" INTEGER;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "imageData" BYTEA;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "imageType" TEXT;

-- Per-season playoff division names. Null keeps the default name for the
-- position (Diamond, Platinum, Gold, Silver, ...), so existing seasons are
-- unchanged until an admin renames a division on /admin/seasons.
ALTER TABLE "Division" ADD COLUMN IF NOT EXISTS "name" TEXT;

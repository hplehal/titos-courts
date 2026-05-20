-- Migration: player_week_stats (2026-05-20)
-- Lets PlayerStat record per-week totals (matching how stats are tracked in
-- the league master sheets) without requiring a specific matchId. Existing
-- per-match rows continue to work — matchId becomes optional, weekId is a
-- new optional FK, and the unique key shifts from (playerId, matchId) to
-- (playerId, weekId) to enforce one stat row per player per week.
-- Additive and idempotent — safe to run twice.

-- 1. Drop the old uniqueness constraint and re-create matchId as nullable.
ALTER TABLE "PlayerStat" DROP CONSTRAINT IF EXISTS "PlayerStat_playerId_matchId_key";
ALTER TABLE "PlayerStat" DROP CONSTRAINT IF EXISTS "PlayerStat_matchId_fkey";
ALTER TABLE "PlayerStat" ALTER COLUMN "matchId" DROP NOT NULL;

-- Re-add the FK as SET NULL so deleting a match doesn't wipe season totals.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlayerStat_matchId_fkey'
  ) THEN
    ALTER TABLE "PlayerStat"
      ADD CONSTRAINT "PlayerStat_matchId_fkey"
      FOREIGN KEY ("matchId") REFERENCES "Match"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- 2. Add weekId column + FK so we can pin stats to a specific game-week.
ALTER TABLE "PlayerStat" ADD COLUMN IF NOT EXISTS "weekId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlayerStat_weekId_fkey'
  ) THEN
    ALTER TABLE "PlayerStat"
      ADD CONSTRAINT "PlayerStat_weekId_fkey"
      FOREIGN KEY ("weekId") REFERENCES "Week"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- 3. Indexes for the new shape.
CREATE INDEX IF NOT EXISTS "PlayerStat_weekId_idx" ON "PlayerStat"("weekId");
CREATE UNIQUE INDEX IF NOT EXISTS "PlayerStat_playerId_weekId_key" ON "PlayerStat"("playerId", "weekId");

ANALYZE "PlayerStat";

-- Migration: tournament_fields (2026-04-17)
-- Additive — zero data loss. Adds fields needed by the tournament system
-- build (Tournament.venue/poolSize/poolCount/endDate, plus winnerId +
-- nextMatchId + seed labels + roundNumber + gameOrder on TournamentMatch).
-- All additions use IF NOT EXISTS, so running twice is safe.

-- ─── Tournament: new configuration fields ───
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "endDate"   TIMESTAMP(3);
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "venue"     TEXT;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "poolSize"  INTEGER;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "poolCount" INTEGER;

-- ─── TournamentMatch: status/advance/seed fields ───
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "winnerId"      TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "nextMatchId"   TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "homeSeedLabel" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "awaySeedLabel" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "roundNumber"   INTEGER;
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "gameOrder"     INTEGER;

-- Self-referencing FK for bracket winner advancement (on delete: set null, so
-- deleting a feeder match doesn't cascade-delete the destination slot).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TournamentMatch_nextMatchId_fkey'
  ) THEN
    ALTER TABLE "TournamentMatch"
      ADD CONSTRAINT "TournamentMatch_nextMatchId_fkey"
      FOREIGN KEY ("nextMatchId") REFERENCES "TournamentMatch"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS "TournamentMatch_nextMatchId_idx" ON "TournamentMatch"("nextMatchId");
CREATE INDEX IF NOT EXISTS "TournamentMatch_status_idx"      ON "TournamentMatch"("status");

-- Refresh planner statistics so the new indexes are picked up immediately.
ANALYZE "Tournament";
ANALYZE "TournamentMatch";

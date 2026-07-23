-- Migration: league_playoff_fields (2026-05-23)
-- Adds the fields needed to model league playoff brackets on the existing
-- Match model:
--   - homeTeamId / awayTeamId become NULLable so SF + Final shells can be
--     created before their teams are known (winners auto-fill via
--     nextMatchId once upstream matches go FINAL).
--   - homeSeedLabel / awaySeedLabel: display labels for empty slots
--     ('1 Seed', 'W QF1', etc.) — rendered when the team is still null.
--   - winnerId: team that won the match. Drives advancement when set.
--   - nextMatchId: self-FK pointing to the next match the winner feeds.
--
-- Additive + idempotent. Regular-season matches keep working unchanged
-- (the seeder still populates homeTeamId/awayTeamId on every row).

ALTER TABLE "Match" ALTER COLUMN "homeTeamId" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "awayTeamId" DROP NOT NULL;

-- Re-create the FK constraints with SET NULL on delete so removing a team
-- doesn't wipe the match shell — the slot just becomes TBD again.
DO $$ BEGIN
  ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_homeTeamId_fkey";
  ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey"
    FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_awayTeamId_fkey";
  ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey"
    FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- New columns
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "homeSeedLabel" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "awaySeedLabel" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "winnerId" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "nextMatchId" TEXT;

-- Winner FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Match_winnerId_fkey'
  ) THEN
    ALTER TABLE "Match"
      ADD CONSTRAINT "Match_winnerId_fkey"
      FOREIGN KEY ("winnerId") REFERENCES "Team"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- Self-FK for bracket advancement
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Match_nextMatchId_fkey'
  ) THEN
    ALTER TABLE "Match"
      ADD CONSTRAINT "Match_nextMatchId_fkey"
      FOREIGN KEY ("nextMatchId") REFERENCES "Match"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Match_nextMatchId_idx" ON "Match"("nextMatchId");
CREATE INDEX IF NOT EXISTS "Match_winnerId_idx" ON "Match"("winnerId");

ANALYZE "Match";

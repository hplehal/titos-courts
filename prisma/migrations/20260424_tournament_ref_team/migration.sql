-- Migration: tournament_ref_team (2026-04-24)
-- Adds refTeamId to TournamentMatch so admins can explicitly assign a team to
-- whistle each match. Pool matches keep the canonical PDF rotation as a
-- fallback when refTeamId is null; bracket matches had no ref-display
-- mechanism before this field.
-- Additive and idempotent — safe to run twice.

ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "refTeamId" TEXT;

-- SetNull so deleting a team doesn't cascade-wipe the match. The match row
-- keeps its other data and just loses its ref assignment.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TournamentMatch_refTeamId_fkey'
  ) THEN
    ALTER TABLE "TournamentMatch"
      ADD CONSTRAINT "TournamentMatch_refTeamId_fkey"
      FOREIGN KEY ("refTeamId") REFERENCES "TournamentTeam"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "TournamentMatch_refTeamId_idx" ON "TournamentMatch"("refTeamId");

ANALYZE "TournamentMatch";

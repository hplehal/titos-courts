-- Migration: tournament_formats (2026-05-22)
-- Extends the tournament system so it can host multiple bracket formats
-- (legacy gold/silver double-bracket + new crossover single-elim) and
-- per-match format/stage overrides for single-set pool play. Additive
-- only; existing tournaments keep their behaviour because the new
-- columns default to the legacy values.

-- Tournament-level format + venue/prize/rules fields
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "venueAddress" TEXT;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "prizePool" INTEGER;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "rules" TEXT;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "bracketFormat" TEXT NOT NULL DEFAULT 'gold-silver';
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "poolMatchFormat" TEXT NOT NULL DEFAULT 'pool-2set-25-cap-27';
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "bracketMatchFormat" TEXT NOT NULL DEFAULT 'bo3-25-15-cap-17';

-- TournamentMatch-level stage + matchFormat (latter is nullable so it
-- can inherit from the tournament defaults when set in the seeder).
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "stage" TEXT NOT NULL DEFAULT 'pool';
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "matchFormat" TEXT;

-- Backfill stage for existing rows: anything with a bracketId belongs to
-- the bracket stage; everything else stays 'pool' from the default.
UPDATE "TournamentMatch" SET "stage" = 'bracket' WHERE "bracketId" IS NOT NULL AND "stage" = 'pool';

CREATE INDEX IF NOT EXISTS "TournamentMatch_stage_idx" ON "TournamentMatch"("stage");

ANALYZE "Tournament";
ANALYZE "TournamentMatch";

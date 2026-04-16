-- Performance indexes — adds indexes on unindexed foreign keys and common
-- filter/sort columns used by the schedule/standings/results queries.
-- Created for Session 2 perf work. Postgres does NOT auto-index FKs, which
-- was causing 3.8% timeout rate + 29.3% CPU throttle on the schedule API.
--
-- To apply against prod:
--   export DATABASE_URL=... # prod DB URL (POSTGRES_PRISMA_URL or direct)
--   npx prisma db execute --file prisma/migrations/20260416_add_performance_indexes/migration.sql
--
-- All statements are idempotent (`IF NOT EXISTS`) so they're safe to re-run.

-- League
CREATE INDEX IF NOT EXISTS "League_isActive_idx" ON "League"("isActive");

-- Season
CREATE INDEX IF NOT EXISTS "Season_leagueId_status_seasonNumber_idx"
  ON "Season"("leagueId", "status", "seasonNumber");

-- Player
CREATE INDEX IF NOT EXISTS "Player_teamId_idx" ON "Player"("teamId");

-- Week
CREATE INDEX IF NOT EXISTS "Week_seasonId_status_idx"
  ON "Week"("seasonId", "status");

-- TierPlacement
CREATE INDEX IF NOT EXISTS "TierPlacement_weekId_idx" ON "TierPlacement"("weekId");
CREATE INDEX IF NOT EXISTS "TierPlacement_tierId_idx" ON "TierPlacement"("tierId");

-- Match — covers both common filter combinations and the 3 team joins
CREATE INDEX IF NOT EXISTS "Match_weekId_status_idx"       ON "Match"("weekId", "status");
CREATE INDEX IF NOT EXISTS "Match_homeTeamId_idx"          ON "Match"("homeTeamId");
CREATE INDEX IF NOT EXISTS "Match_awayTeamId_idx"          ON "Match"("awayTeamId");
CREATE INDEX IF NOT EXISTS "Match_refTeamId_idx"           ON "Match"("refTeamId");
CREATE INDEX IF NOT EXISTS "Match_weekId_tierNumber_gameOrder_idx"
  ON "Match"("weekId", "tierNumber", "gameOrder");

-- PlayerStat
CREATE INDEX IF NOT EXISTS "PlayerStat_matchId_idx" ON "PlayerStat"("matchId");

-- Tournament system
CREATE INDEX IF NOT EXISTS "TournamentTeam_tournamentId_idx"    ON "TournamentTeam"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentTeam_poolId_idx"          ON "TournamentTeam"("poolId");
CREATE INDEX IF NOT EXISTS "TournamentPool_tournamentId_idx"    ON "TournamentPool"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentBracket_tournamentId_idx" ON "TournamentBracket"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentMatch_poolId_idx"         ON "TournamentMatch"("poolId");
CREATE INDEX IF NOT EXISTS "TournamentMatch_bracketId_idx"      ON "TournamentMatch"("bracketId");
CREATE INDEX IF NOT EXISTS "TournamentMatch_homeTeamId_idx"     ON "TournamentMatch"("homeTeamId");
CREATE INDEX IF NOT EXISTS "TournamentMatch_awayTeamId_idx"     ON "TournamentMatch"("awayTeamId");

-- Refresh Postgres planner statistics so the new indexes get used immediately.
ANALYZE "League";
ANALYZE "Season";
ANALYZE "Player";
ANALYZE "Week";
ANALYZE "TierPlacement";
ANALYZE "Match";
ANALYZE "PlayerStat";
ANALYZE "TournamentTeam";
ANALYZE "TournamentPool";
ANALYZE "TournamentBracket";
ANALYZE "TournamentMatch";

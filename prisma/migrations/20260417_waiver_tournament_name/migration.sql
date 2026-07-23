-- Migration: waiver_tournament_name (2026-04-17)
-- Additive — zero data loss. Adds Waiver.tournamentName so players signing up
-- for a tournament can record WHICH tournament they are signing the waiver
-- for (previously only leagueDay/teamName were captured, which conflated
-- league and tournament participation).
-- IF NOT EXISTS makes re-running safe.

ALTER TABLE "Waiver" ADD COLUMN IF NOT EXISTS "tournamentName" TEXT;

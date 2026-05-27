-- Migration: match_scheduled_time (2026-05-23)
-- Adds an optional scheduledTime to Match so playoff QFs/SFs/Final can
-- carry explicit start times (different from the regular round-robin
-- pattern where every game in a week shares one start time).
-- Additive + idempotent.

ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "scheduledTime" TIMESTAMP(3);

ANALYZE "Match";

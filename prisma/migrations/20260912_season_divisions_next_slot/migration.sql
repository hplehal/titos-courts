-- Per-season playoff division sizes + explicit winner slot on playoff matches.
-- Additive only: seasons without Division rows keep the automatic even split,
-- and matches with a null nextSlot keep the legacy advancement rules.

CREATE TABLE IF NOT EXISTS "Division" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "teamCount" INTEGER NOT NULL,
    "courtNumber" INTEGER,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Division_seasonId_position_key" ON "Division"("seasonId", "position");

DO $$ BEGIN
    ALTER TABLE "Division" ADD CONSTRAINT "Division_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "nextSlot" TEXT;

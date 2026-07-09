-- SQL Migration Script for Successor Dashboard Phase 5
-- Run this script in your Supabase SQL Editor to support the Teamcheck tool

-- 1. Extend the players table with Kickbase stats columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS kickbase_points INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS goals INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS assists INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb;

-- 2. Add an index for faster queries by team
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);

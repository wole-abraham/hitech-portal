-- ============================================================
-- Hitech Portal — Schema Updates
-- Run this in the Supabase SQL editor.
-- ============================================================

-- Fix #5: add fleet_number to report machine table so submissions
-- link back to the planning table (surveycollection_planningtable)
ALTER TABLE hitech_report_hitechmachine
  ADD COLUMN IF NOT EXISTS fleet_number TEXT NOT NULL DEFAULT '';

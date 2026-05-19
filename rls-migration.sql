-- ============================================================
-- Hitech Portal — Enable Row Level Security
-- Run this in the Supabase SQL editor.
--
-- Strategy: enable RLS on every table so the anon key is
-- denied by default. All app access goes through API routes
-- using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- No policies are needed — service role always wins.
-- ============================================================

ALTER TABLE auth_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveycollection_employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveycollection_planningtable ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveycollection_project ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveycollection_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveycollection_machinestatusreport ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitech_report_hitechreport ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitech_report_hitechemployee ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitech_report_hitechsupervisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitech_report_hitechengineer ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitech_report_hitechmachine ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitech_report_hitechphoto ENABLE ROW LEVEL SECURITY;

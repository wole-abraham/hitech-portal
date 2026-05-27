-- ============================================================
-- Hitech Portal — Schema Updates
-- Run this in the Supabase SQL editor.
-- ============================================================

-- Fix #5: add fleet_number to report machine table so submissions
-- link back to the planning table (surveycollection_planningtable)
ALTER TABLE hitech_report_hitechmachine
  ADD COLUMN IF NOT EXISTS fleet_number TEXT NOT NULL DEFAULT '';

-- Fix #6: expand planned activities to mirror the full activity report schema.
-- Run in Supabase SQL editor.
ALTER TABLE hitech_report_plannedactivity
  ADD COLUMN IF NOT EXISTS activity_status           TEXT,
  ADD COLUMN IF NOT EXISTS party_for_activity        TEXT,
  ADD COLUMN IF NOT EXISTS subcontractor_name_activity TEXT,
  ADD COLUMN IF NOT EXISTS comment_activity          TEXT,
  ADD COLUMN IF NOT EXISTS not_conforming            TEXT DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS not_conforming_issue      TEXT,
  ADD COLUMN IF NOT EXISTS not_conforming_correction TEXT,
  ADD COLUMN IF NOT EXISTS car_used                  TEXT DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS team_car                  TEXT,
  ADD COLUMN IF NOT EXISTS custom_data               JSONB;

-- Planned activity sub-tables (mirror the report sub-tables)
CREATE TABLE IF NOT EXISTS hitech_plan_employee (
  id                    SERIAL PRIMARY KEY,
  plan_id               INTEGER NOT NULL REFERENCES hitech_report_plannedactivity(id) ON DELETE CASCADE,
  employee_name         TEXT,
  employee_role         TEXT,
  party                 TEXT DEFAULT 'Employee',
  subcontractor_name    TEXT,
  employee_missing_name TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hitech_plan_supervisor (
  id                      SERIAL PRIMARY KEY,
  plan_id                 INTEGER NOT NULL REFERENCES hitech_report_plannedactivity(id) ON DELETE CASCADE,
  supervisor_name         TEXT,
  party                   TEXT DEFAULT 'Hitech employees',
  subcontractor_name      TEXT,
  supervisor_missing_name TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hitech_plan_machine (
  id                SERIAL PRIMARY KEY,
  plan_id           INTEGER NOT NULL REFERENCES hitech_report_plannedactivity(id) ON DELETE CASCADE,
  fleet_number      TEXT,
  machine_name      TEXT,
  machine_belonging TEXT,
  driver_name       TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ── Drainage / Road Components table (imported from CSV) ──────────────────
-- Stores pre-surveyed structures: Box culvert, Ducts, Discharge, Manholes, etc.
-- Lookup key: project_name + section_name + chainage + item + side
CREATE TABLE IF NOT EXISTS hitech_report_component (
  id                     SERIAL PRIMARY KEY,
  project_name           TEXT NOT NULL,
  section_name           TEXT NOT NULL,
  chainage               TEXT NOT NULL,
  chainage_m             NUMERIC,
  item                   TEXT NOT NULL,   -- e.g. "Box culvert", "Manholes"
  side                   TEXT NOT NULL,   -- RHS | LHS | Median
  measurements           TEXT,
  nbr_cell               TEXT,            -- number of cells or material note
  length                 NUMERIC,
  status                 TEXT,
  total_length_to_order  NUMERIC,
  consideration_status   TEXT,
  comment                TEXT,
  low_point_elevation    TEXT,
  northing               NUMERIC,
  easting                NUMERIC,
  created_at             TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_component_unique
  ON hitech_report_component (project_name, section_name, chainage, item, side);

CREATE INDEX IF NOT EXISTS idx_component_lookup
  ON hitech_report_component (project_name, section_name, chainage, item, side);

ALTER TABLE hitech_report_component ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read components"
  ON hitech_report_component FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anon reads so the submit form can load plan detail without service-role
ALTER TABLE hitech_plan_employee  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitech_plan_supervisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitech_plan_machine   ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read plan employees"  ON hitech_plan_employee  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read plan supervisors" ON hitech_plan_supervisor FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read plan machines"   ON hitech_plan_machine   FOR SELECT USING (auth.role() = 'authenticated');

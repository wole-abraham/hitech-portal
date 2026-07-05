ALTER TABLE hitech_report_hitechreport
  ADD COLUMN IF NOT EXISTS planned_activity_id integer;

CREATE INDEX IF NOT EXISTS idx_report_planned_activity
  ON hitech_report_hitechreport (planned_activity_id);

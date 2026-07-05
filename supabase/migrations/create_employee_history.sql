-- Tracks all field-level changes to employee records (beyond just status).
-- No FK constraint: history survives employee deletion.

CREATE TABLE IF NOT EXISTS surveycollection_employee_history (
  id            serial       PRIMARY KEY,
  employee_id   integer      NOT NULL,
  employee_name text         NOT NULL,
  field_name    text         NOT NULL,
  old_value     text,
  new_value     text,
  changed_by    text         NOT NULL,
  changed_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eh_employee   ON surveycollection_employee_history (employee_id);
CREATE INDEX IF NOT EXISTS idx_eh_changed_at ON surveycollection_employee_history (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_eh_field      ON surveycollection_employee_history (field_name);

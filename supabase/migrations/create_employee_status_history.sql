-- Track every status change made to an employee record.
-- No FK constraint on employee_id intentionally: history should survive employee deletion.

CREATE TABLE IF NOT EXISTS surveycollection_employee_status_history (
  id              serial       PRIMARY KEY,
  employee_id     integer      NOT NULL,
  employee_name   text         NOT NULL,
  previous_status text,
  new_status      text         NOT NULL,
  changed_by      text         NOT NULL,
  changed_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_esh_employee   ON surveycollection_employee_status_history (employee_id);
CREATE INDEX IF NOT EXISTS idx_esh_changed_at ON surveycollection_employee_status_history (changed_at DESC);

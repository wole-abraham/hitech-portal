-- Snapshots a planned activity's key fields whenever it is edited.
-- No FK constraint: history survives plan deletion.

CREATE TABLE IF NOT EXISTS hitech_plan_activity_history (
  id                        serial       PRIMARY KEY,
  plan_id                   integer      NOT NULL,
  plan_title                text         NOT NULL,
  project_name              text,
  section_name              text,
  activity_category         text,
  activity_type             text,
  activity_subtype          text,
  side                      text,
  activity_status           text,
  start_chainage            text,
  end_chainage              text,
  weather                   text,
  party_for_activity        text,
  not_conforming            text,
  car_used                  text,
  changed_by                text         NOT NULL,
  changed_at                timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pah_plan_id    ON hitech_plan_activity_history (plan_id);
CREATE INDEX IF NOT EXISTS idx_pah_changed_at ON hitech_plan_activity_history (changed_at DESC);

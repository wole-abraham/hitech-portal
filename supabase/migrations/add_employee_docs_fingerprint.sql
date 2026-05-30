-- Add passport documents and fingerprint ID to employees

ALTER TABLE surveycollection_employee
  ADD COLUMN IF NOT EXISTS passport_photo    text,
  ADD COLUMN IF NOT EXISTS passport_document text,
  ADD COLUMN IF NOT EXISTS fingerprint_id    text;

-- Add fuel and hour meter tracking to equipment tables

ALTER TABLE surveycollection_planningtable
  ADD COLUMN IF NOT EXISTS litres    numeric(10,2),
  ADD COLUMN IF NOT EXISTS hour_meter numeric(10,1);

ALTER TABLE surveycollection_machinestatusreport
  ADD COLUMN IF NOT EXISTS litres    numeric(10,2),
  ADD COLUMN IF NOT EXISTS hour_meter numeric(10,1);

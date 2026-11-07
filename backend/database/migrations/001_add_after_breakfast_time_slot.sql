BEGIN;

ALTER TABLE readings
  DROP CONSTRAINT IF EXISTS readings_time_slot_check;

ALTER TABLE readings
  ADD CONSTRAINT readings_time_slot_check
  CHECK (time_slot IN ('morning', 'after_breakfast', 'afternoon', 'evening', 'bedtime'));

COMMIT;

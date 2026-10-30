-- Vellore gets its own slot catalog (on-the-hour theory periods, V1–V7),
-- separate from Chennai's 'standard'.
ALTER TABLE semesters DROP CONSTRAINT IF EXISTS semesters_slot_variant_check;
ALTER TABLE semesters ADD CONSTRAINT semesters_slot_variant_check
  CHECK (slot_variant IN ('standard', 'vellore', 'bhopal', 'ap'));

UPDATE semesters SET slot_variant = 'vellore' WHERE campus = 'vellore';

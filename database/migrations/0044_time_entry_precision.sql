-- Preserve sub-minute timer entries without rounding a positive duration to zero.
-- Six fractional hour digits retain seconds within 0.002 seconds.
alter table time_entries alter column hours type numeric(12,6);

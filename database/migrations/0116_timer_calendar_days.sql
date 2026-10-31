-- Preserve dated checkpoints; never guess dates for multi-day legacy pauses.
alter table active_time_trackers add column day_seconds jsonb not null default '{}'
 check(jsonb_typeof(day_seconds)='object');
update active_time_trackers set day_seconds=jsonb_build_object(
 (started_at at time zone 'Europe/Zurich')::date::text,accumulated_seconds)
 where accumulated_seconds>0 and (started_at at time zone 'Europe/Zurich')::date=(updated_at at time zone 'Europe/Zurich')::date;

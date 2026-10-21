-- Remove an attachment from active use without destroying retained evidence.
alter table file_objects add column if not exists archived_at timestamptz;
alter table file_objects add column if not exists archived_by_user_id text references app_users(id);
create index if not exists file_objects_active_entity_idx on file_objects(organization_id,purpose,created_at desc) where archived_at is null;

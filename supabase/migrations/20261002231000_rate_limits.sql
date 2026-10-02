-- Distributed API rate limiting stored as opaque hashed keys.
-- Direct table access is not granted. The RPC owns the route allowlist and limits so callers cannot weaken policy.

create table if not exists public.api_rate_limits (
  route text not null,
  key_hash text not null,
  bucket_start timestamptz not null,
  request_count int not null default 1 check(request_count > 0),
  expires_at timestamptz not null,
  primary key(route,key_hash,bucket_start)
);

create index if not exists idx_api_rate_limits_expires on public.api_rate_limits(expires_at);

alter table public.api_rate_limits enable row level security;

revoke all on public.api_rate_limits from anon,authenticated;

create or replace function public.consume_api_rate_limit(
  p_route text,
  p_key_hash text
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  request_limit int;
  window_seconds int;
  bucket_epoch bigint;
  bucket_time timestamptz;
  new_count int;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid key'; end if;

  case p_route
    when 'auth.login:ip' then request_limit:=30; window_seconds:=900;
    when 'auth.login:identity' then request_limit:=10; window_seconds:=900;
    when 'auth.register:ip' then request_limit:=10; window_seconds:=3600;
    when 'auth.register:identity' then request_limit:=5; window_seconds:=3600;
    when 'auth.recover:ip' then request_limit:=10; window_seconds:=3600;
    when 'auth.recover:identity' then request_limit:=5; window_seconds:=3600;
    else raise exception 'unsupported rate-limit route';
  end case;

  bucket_epoch:=floor(extract(epoch from now())/window_seconds)*window_seconds;
  bucket_time:=to_timestamp(bucket_epoch);

  insert into public.api_rate_limits(route,key_hash,bucket_start,request_count,expires_at)
  values(p_route,p_key_hash,bucket_time,1,bucket_time+make_interval(secs=>window_seconds*2))
  on conflict(route,key_hash,bucket_start)
  do update set request_count=public.api_rate_limits.request_count+1
  returning request_count into new_count;

  delete from public.api_rate_limits where expires_at<now()-interval '1 hour';

  return new_count<=request_limit;
end $$;

revoke all on function public.consume_api_rate_limit(text,text) from public,anon,authenticated;
grant execute on function public.consume_api_rate_limit(text,text) to service_role;

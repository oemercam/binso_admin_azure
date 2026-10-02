-- Distributed API rate limiting stored as opaque hashed keys.
-- Direct table access is not granted; only the constrained RPC is executable by anon/authenticated.

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
  p_key_hash text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  bucket_epoch bigint;
  bucket_time timestamptz;
  new_count int;
begin
  if p_route is null or char_length(p_route)<1 or char_length(p_route)>120 then raise exception 'invalid route'; end if;
  if p_key_hash is null or char_length(p_key_hash)<16 or char_length(p_key_hash)>128 then raise exception 'invalid key'; end if;
  if p_limit<1 or p_limit>1000 then raise exception 'invalid limit'; end if;
  if p_window_seconds<1 or p_window_seconds>86400 then raise exception 'invalid window'; end if;

  bucket_epoch:=floor(extract(epoch from now())/p_window_seconds)*p_window_seconds;
  bucket_time:=to_timestamp(bucket_epoch);

  insert into public.api_rate_limits(route,key_hash,bucket_start,request_count,expires_at)
  values(p_route,p_key_hash,bucket_time,1,bucket_time+make_interval(secs=>p_window_seconds*2))
  on conflict(route,key_hash,bucket_start)
  do update set request_count=public.api_rate_limits.request_count+1
  returning request_count into new_count;

  delete from public.api_rate_limits where expires_at<now()-interval '1 hour';

  return new_count<=p_limit;
end $$;

revoke all on function public.consume_api_rate_limit(text,text,int,int) from public;
grant execute on function public.consume_api_rate_limit(text,text,int,int) to anon,authenticated;

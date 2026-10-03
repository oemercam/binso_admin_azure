-- Complete production telemetry rate limiting and make invitation capacity atomic.

create or replace function public.consume_api_rate_limit(p_route text,p_key_hash text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare request_limit int; window_seconds int; bucket_epoch bigint; bucket_time timestamptz; new_count int;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid key'; end if;
  case p_route
    when 'auth.login:ip' then request_limit:=30; window_seconds:=900;
    when 'auth.login:identity' then request_limit:=10; window_seconds:=900;
    when 'auth.register:ip' then request_limit:=10; window_seconds:=3600;
    when 'auth.register:identity' then request_limit:=5; window_seconds:=3600;
    when 'auth.recover:ip' then request_limit:=10; window_seconds:=3600;
    when 'auth.recover:identity' then request_limit:=5; window_seconds:=3600;
    when 'telemetry.web_vitals:ip' then request_limit:=180; window_seconds:=60;
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

create or replace function public.create_tenant_invitation(p_tenant_id uuid,p_email text,p_role public.membership_role default 'member')
returns uuid
language plpgsql security definer set search_path=public
as $$
declare invitation_id uuid; member_count int; pending_count int; allowed_count int;
begin
  if not public.is_tenant_admin(p_tenant_id) or not public.tenant_account_allows_access(p_tenant_id) then raise exception 'not authorized'; end if;
  if p_email is null or length(trim(p_email))<3 then raise exception 'invalid email'; end if;

  -- Serialize capacity decisions per tenant so concurrent invites cannot exceed the plan.
  select user_limit into allowed_count from public.tenant_accounts where tenant_id=p_tenant_id for update;
  if allowed_count is null then raise exception 'tenant account missing'; end if;

  update public.tenant_invitations set status='expired'
  where tenant_id=p_tenant_id and status='pending' and expires_at<=now();

  select count(*) into member_count from public.tenant_memberships where tenant_id=p_tenant_id;
  select count(*) into pending_count from public.tenant_invitations
  where tenant_id=p_tenant_id and status='pending' and expires_at>now();

  if member_count+pending_count>=allowed_count then raise exception 'user limit reached'; end if;

  insert into public.tenant_invitations(tenant_id,email,role,invited_by)
  values(p_tenant_id,lower(trim(p_email)),p_role,auth.uid()) returning id into invitation_id;
  return invitation_id;
end $$;

revoke all on function public.create_tenant_invitation(uuid,text,public.membership_role) from public;
grant execute on function public.create_tenant_invitation(uuid,text,public.membership_role) to authenticated;

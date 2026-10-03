create table if not exists public.web_vitals (
  id bigint generated always as identity primary key,
  metric text not null check(metric in ('CLS','FCP','INP','LCP','TTFB')),
  value double precision not null,
  rating text check(rating in ('good','needs-improvement','poor')),
  route text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_web_vitals_metric_created on public.web_vitals(metric,created_at desc);
alter table public.web_vitals enable row level security;
revoke all on public.web_vitals from anon,authenticated;
create policy web_vitals_operator_select on public.web_vitals for select using(public.is_operator());

create extension if not exists pgcrypto;

create type public.verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'FAILED');
create type public.scan_status as enum ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
create type public.finding_severity as enum ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');
create type public.finding_confidence as enum ('POTENTIAL', 'LIKELY', 'CONFIRMED');
create type public.finding_detection_method as enum ('PASSIVE', 'ACTIVE', 'RULE', 'ML', 'HYBRID');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.websites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  url text not null,
  normalized_origin text not null,
  verification_token text not null,
  verification_status public.verification_status not null default 'UNVERIFIED',
  verified_at timestamptz,
  last_score integer check (last_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, normalized_origin)
);

create table public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  scan_type text not null default 'DEEP_SCAN' check (scan_type = 'DEEP_SCAN'),
  status public.scan_status not null default 'PENDING',
  current_stage text not null default 'VALIDATING_TARGET',
  progress integer not null default 0 check (progress between 0 and 100),
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  error_message_safe text,
  model_version text,
  score integer check (score between 0 and 100),
  score_formula_version text,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    (status in ('PENDING', 'RUNNING') and finished_at is null)
    or status in ('COMPLETED', 'FAILED', 'CANCELLED')
  )
);

create unique index scan_jobs_one_active_scan_per_website
  on public.scan_jobs (website_id)
  where status in ('PENDING', 'RUNNING');

create table public.website_input_authorizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  source_scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  method text not null check (method = 'POST'),
  path text not null check (path like '/%'),
  parameter_name text not null check (char_length(parameter_name) between 1 and 200),
  approved_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (website_id, method, path, parameter_name)
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  title text not null,
  category text not null,
  severity public.finding_severity not null,
  endpoint text not null,
  parameter text,
  description text not null,
  evidence jsonb not null,
  recommendation text not null,
  detection_method public.finding_detection_method not null,
  confidence public.finding_confidence not null,
  fingerprint text not null,
  status text not null check (status in ('NEW', 'UNCHANGED')),
  created_at timestamptz not null default now(),
  unique (scan_id, fingerprint)
);

create table public.model_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  dataset_version text not null,
  algorithm text not null,
  dataset_size integer not null check (dataset_size > 0),
  class_distribution jsonb not null,
  training_date timestamptz not null,
  metrics jsonb not null,
  artifact_name text not null,
  artifact_sha256 text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index model_versions_one_active_model on public.model_versions ((is_active)) where is_active;
create index websites_user_id_idx on public.websites (user_id);
create index scan_jobs_user_created_idx on public.scan_jobs (user_id, created_at desc);
create index scan_jobs_website_created_idx on public.scan_jobs (website_id, created_at desc);
create index findings_scan_id_idx on public.findings (scan_id);
create index findings_website_fingerprint_idx on public.findings (website_id, fingerprint);
create index findings_user_severity_idx on public.findings (user_id, severity);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger websites_set_updated_at before update on public.websites
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger auth_user_profile_after_insert
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.websites enable row level security;
alter table public.scan_jobs enable row level security;
alter table public.website_input_authorizations enable row level security;
alter table public.findings enable row level security;
alter table public.model_versions enable row level security;

create policy "profiles are private to the owner" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "websites are private to the owner" on public.websites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "scan jobs are private to the owner" on public.scan_jobs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "input authorizations are private to the owner" on public.website_input_authorizations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "findings are private to the owner" on public.findings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "authenticated users can read model metadata" on public.model_versions
  for select to authenticated using (true);

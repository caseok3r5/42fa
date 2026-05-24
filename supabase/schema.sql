create extension if not exists pgcrypto;

create table if not exists public.batches (
  id text primary key,
  source_profile text not null,
  scrape_type text not null check (scrape_type in ('followers', 'following')),
  requested_limit integer not null,
  apify_dataset_id text,
  status text not null default 'created' check (status in ('created', 'scraped', 'ingested', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  instagram_url text not null,
  full_name text,
  profile_description text,
  profile_pic_url text,
  category text not null default 'unknown',
  location text,
  practice text,
  account_type text not null default 'unknown',
  human_name_confidence text not null default 'low',
  gender_guess text,
  followers integer,
  following integer,
  posts integer,
  verified boolean not null default false,
  is_business_account boolean not null default false,
  public_account boolean not null default true,
  fit_score integer not null default 0,
  tier text not null default 'D',
  pitch_angle text,
  score_reason text not null default '',
  dm_template text,
  review_status text not null default 'new' check (review_status in ('new', 'reviewed', 'shortlisted', 'skip', 'do_not_contact')),
  dm_status text not null default 'not_sent' check (dm_status in ('not_sent', 'sent', 'responded', 'no_response')),
  outcome_status text not null default 'none' check (outcome_status in ('none', 'seeded', 'posted', 'declined')),
  notes text,
  source_profile text not null,
  batch_id text not null,
  scrape_type text not null check (scrape_type in ('followers', 'following')),
  raw_json jsonb not null default '{}'::jsonb,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_tier_idx on public.profiles (tier, fit_score desc);
create index if not exists profiles_category_idx on public.profiles (category);
create index if not exists profiles_source_profile_idx on public.profiles (source_profile);
create index if not exists profiles_review_status_idx on public.profiles (review_status);
create index if not exists profiles_dm_status_idx on public.profiles (dm_status);
create index if not exists profiles_followers_idx on public.profiles (followers);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists batches_touch_updated_at on public.batches;
create trigger batches_touch_updated_at
before update on public.batches
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.batches enable row level security;

create policy "service role profiles access"
on public.profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role batches access"
on public.batches
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

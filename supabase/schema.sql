-- Run this in the Supabase SQL editor once.

create table if not exists public.tokens (
  address text primary key,
  name text not null,
  symbol text not null,
  creator text not null,
  image text default '',
  description text default '',
  tx_hash text default '',
  created_at timestamptz not null default now()
);

create index if not exists tokens_creator_idx on public.tokens (creator);
create index if not exists tokens_created_at_idx on public.tokens (created_at desc);

create table if not exists public.trades (
  id bigint generated always as identity primary key,
  token text not null,
  trader text not null,
  is_buy boolean not null,
  amount_eth double precision not null default 0,
  fdv_eth double precision,
  tx_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists trades_token_idx on public.trades (token, created_at);

create table if not exists public.profiles (
  address text primary key,
  name text default '',
  bio text default '',
  avatar text default '',
  website text default '',
  twitter text default '',
  telegram text default '',
  updated_at timestamptz not null default now()
);

alter table public.tokens enable row level security;
alter table public.trades enable row level security;
alter table public.profiles enable row level security;

create policy "tokens_read" on public.tokens for select using (true);
create policy "tokens_insert" on public.tokens for insert with check (true);
create policy "tokens_update" on public.tokens for update using (true);

create policy "trades_read" on public.trades for select using (true);
create policy "trades_insert" on public.trades for insert with check (true);

create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_upsert" on public.profiles for insert with check (true);
create policy "profiles_update" on public.profiles for update using (true);

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos_read" on storage.objects for select using (bucket_id = 'logos');
create policy "logos_write" on storage.objects for insert with check (bucket_id = 'logos');

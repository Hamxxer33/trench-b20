-- Trench backend schema. Run once in the Supabase SQL editor.
--
-- Writes go through the Next.js API with the service-role key, which verifies
-- every row against Base first. The anon key the browser holds is read-only —
-- see the policies at the bottom.

create table if not exists public.tokens (
  address text primary key,
  name text not null,
  symbol text not null,
  creator text not null,
  quote text not null default '0x0000000000000000000000000000000000000000',
  image text default '',
  description text default '',
  website text default '',
  twitter text default '',
  telegram text default '',
  tx_hash text default '',
  block_number bigint,
  created_at timestamptz not null default now()
);

create index if not exists tokens_creator_idx on public.tokens (creator);
create index if not exists tokens_created_at_idx on public.tokens (created_at desc);
create index if not exists tokens_quote_idx on public.tokens (quote);

create table if not exists public.trades (
  id bigint generated always as identity primary key,
  token text not null,
  trader text not null,
  referrer text not null default '0x0000000000000000000000000000000000000000',
  is_buy boolean not null,
  -- Quote asset the pool is paired against: zero address for ETH, else a stock B20.
  quote text not null default '0x0000000000000000000000000000000000000000',
  -- Size in that quote asset. amount_eth stays populated only for ETH pairs so
  -- "volume in ETH" never silently sums Apple shares into it.
  amount_quote double precision not null default 0,
  amount_eth double precision not null default 0,
  amount_token double precision not null default 0,
  fee_quote double precision not null default 0,
  fdv_eth double precision,
  tx_hash text not null,
  log_index integer not null default 0,
  block_number bigint,
  created_at timestamptz not null default now(),
  -- One row per emitted Trade event; replaying a hash is a no-op upsert.
  constraint trades_tx_log_key unique (tx_hash, log_index)
);

create index if not exists trades_token_idx on public.trades (token, created_at desc);
create index if not exists trades_trader_idx on public.trades (trader, created_at desc);
create index if not exists trades_created_at_idx on public.trades (created_at desc);

create table if not exists public.profiles (
  address text primary key,
  name text default '',
  bio text default '',
  avatar text default '',
  website text default '',
  twitter text default '',
  telegram text default '',
  global_referrer text default '0x0000000000000000000000000000000000000000',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Aggregation. Kept in Postgres so the board never downloads the trade table.
-- ---------------------------------------------------------------------------

create or replace function public.trade_totals()
returns table (
  volume_eth double precision,
  volume_quote double precision,
  trades bigint,
  traders bigint,
  tokens bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(t.amount_eth), 0)::double precision,
    coalesce(sum(t.amount_quote), 0)::double precision,
    count(*)::bigint,
    count(distinct t.trader)::bigint,
    count(distinct t.token)::bigint
  from public.trades t;
$$;

create or replace function public.top_tokens(p_limit integer default 12)
returns table (
  token text,
  volume_eth double precision,
  volume_quote double precision,
  trades bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.token,
    coalesce(sum(t.amount_eth), 0)::double precision,
    coalesce(sum(t.amount_quote), 0)::double precision,
    count(*)::bigint
  from public.trades t
  group by t.token
  order by 2 desc, 4 desc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

create or replace function public.token_stats(p_token text)
returns table (
  trades bigint,
  volume_quote double precision,
  volume_eth double precision,
  buys bigint,
  sells bigint,
  traders bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint,
    coalesce(sum(t.amount_quote), 0)::double precision,
    coalesce(sum(t.amount_eth), 0)::double precision,
    count(*) filter (where t.is_buy)::bigint,
    count(*) filter (where not t.is_buy)::bigint,
    count(distinct t.trader)::bigint
  from public.trades t
  where t.token = lower(p_token);
$$;

-- ---------------------------------------------------------------------------
-- RLS. The anon key is public by design, so it gets reads and nothing else.
-- ---------------------------------------------------------------------------

alter table public.tokens enable row level security;
alter table public.trades enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "tokens_read" on public.tokens;
drop policy if exists "tokens_insert" on public.tokens;
drop policy if exists "tokens_update" on public.tokens;
drop policy if exists "trades_read" on public.trades;
drop policy if exists "trades_insert" on public.trades;
drop policy if exists "profiles_read" on public.profiles;
drop policy if exists "profiles_upsert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "tokens_read" on public.tokens for select using (true);
create policy "trades_read" on public.trades for select using (true);
create policy "profiles_read" on public.profiles for select using (true);

-- No insert/update/delete policies: the service-role key used by the API
-- bypasses RLS, everyone else is read-only.

grant execute on function public.trade_totals() to anon, authenticated;
grant execute on function public.top_tokens(integer) to anon, authenticated;
grant execute on function public.token_stats(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage for launch logos. Uploads go through /api/upload (service role).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_read" on storage.objects;
drop policy if exists "logos_write" on storage.objects;

create policy "logos_read" on storage.objects for select using (bucket_id = 'logos');

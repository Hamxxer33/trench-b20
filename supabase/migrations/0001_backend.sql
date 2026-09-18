-- Upgrade an existing Trench database to the verified backend.
--
-- Safe to run on a DB created from the first version of schema.sql. If you are
-- starting fresh, just run schema.sql instead — it already includes all of this.

-- New columns -----------------------------------------------------------------

alter table public.tokens
  add column if not exists quote text not null default '0x0000000000000000000000000000000000000000',
  add column if not exists website text default '',
  add column if not exists twitter text default '',
  add column if not exists telegram text default '',
  add column if not exists block_number bigint;

alter table public.trades
  add column if not exists referrer text not null default '0x0000000000000000000000000000000000000000',
  add column if not exists quote text not null default '0x0000000000000000000000000000000000000000',
  add column if not exists amount_quote double precision not null default 0,
  add column if not exists amount_token double precision not null default 0,
  add column if not exists fee_quote double precision not null default 0,
  add column if not exists log_index integer not null default 0,
  add column if not exists block_number bigint;

alter table public.profiles
  add column if not exists global_referrer text default '0x0000000000000000000000000000000000000000';

-- Backfill: rows written by the old client only ever carried ETH amounts.
update public.trades
set amount_quote = amount_eth
where amount_quote = 0 and amount_eth > 0;

-- De-duplicate before the unique constraint can be added. Old rows had no
-- log_index, so a double-submitted hash could land twice.
delete from public.trades a
using public.trades b
where a.tx_hash = b.tx_hash
  and a.log_index = b.log_index
  and a.id > b.id;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trades_tx_log_key'
  ) then
    alter table public.trades add constraint trades_tx_log_key unique (tx_hash, log_index);
  end if;
end $$;

create index if not exists tokens_quote_idx on public.tokens (quote);
create index if not exists trades_trader_idx on public.trades (trader, created_at desc);
create index if not exists trades_created_at_idx on public.trades (created_at desc);

-- Close the open write policies -----------------------------------------------
--
-- Dropped by shape, not by name. An earlier version of this file listed names
-- ("profiles_upsert", "logos_write") that did not match what was actually in
-- the database ("profiles_insert", "logos_insert", "logos_update"), and
-- `drop policy if exists` on a wrong name is a silent no-op — so three write
-- holes stayed open while the migration reported success. Anything that is not
-- a SELECT policy goes, whatever it was called.

do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where cmd <> 'SELECT'
      and (
        (schemaname = 'public' and tablename in ('tokens', 'trades', 'profiles'))
        or (schemaname = 'storage' and tablename = 'objects' and policyname like 'logos%')
      )
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Aggregation functions live in schema.sql; re-run that file after this
-- migration to create them (it is idempotent).

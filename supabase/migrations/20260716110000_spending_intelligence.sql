-- Intelligence tables are additive: existing receipt processing continues to use
-- public.receipts and public.receipt_items without any contract changes.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_name text not null,
  display_name text not null,
  logo_url text,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, canonical_name)
);

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  receipt_id uuid references public.receipts(id) on delete cascade,
  insight_type text not null check (insight_type in (
    'spending_pattern', 'monthly_comparison', 'merchant_pattern',
    'saving_opportunity', 'subscription', 'achievement'
  )),
  title text not null,
  description text not null,
  supporting_data jsonb not null default '{}'::jsonb,
  recommendation text,
  impact text not null default 'low' check (impact in ('low', 'medium', 'high')),
  confidence numeric(4,3) not null default 0 check (confidence between 0 and 1),
  period_start date,
  period_end date,
  status text not null default 'active' check (status in ('active', 'dismissed', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.spending_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_id uuid references public.merchants(id) on delete cascade,
  pattern_type text not null check (pattern_type in ('recurring_payment', 'merchant_trend', 'category_trend', 'saving_habit')),
  period text not null default 'monthly',
  value jsonb not null default '{}'::jsonb,
  confidence numeric(4,3) not null default 0 check (confidence between 0 and 1),
  last_detected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  spending_dna jsonb not null default '[]'::jsonb,
  receipt_streak integer not null default 0 check (receipt_streak >= 0),
  last_receipt_at timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists merchants_user_name_idx on public.merchants (user_id, canonical_name);
create index if not exists insights_user_created_idx on public.insights (user_id, created_at desc);
create index if not exists insights_user_period_idx on public.insights (user_id, period_start desc);
create index if not exists patterns_user_type_idx on public.spending_patterns (user_id, pattern_type);

alter table public.merchants enable row level security;
alter table public.insights enable row level security;
alter table public.spending_patterns enable row level security;
alter table public.user_profiles enable row level security;

create policy "Users read own merchants" on public.merchants for select using (auth.uid() = user_id);
create policy "Users manage own merchants" on public.merchants for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own insights" on public.insights for select using (auth.uid() = user_id);
create policy "Users manage own insights" on public.insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own spending patterns" on public.spending_patterns for select using (auth.uid() = user_id);
create policy "Users manage own spending patterns" on public.spending_patterns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own profile" on public.user_profiles for select using (auth.uid() = user_id);
create policy "Users manage own profile" on public.user_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.categories enable row level security;
create policy "Authenticated users read categories" on public.categories for select to authenticated using (true);

insert into public.categories (name, icon, color) values
  ('Coffee', 'coffee', '#A16207'),
  ('Dining', 'utensils', '#EA580C'),
  ('Groceries', 'shopping-basket', '#16A34A'),
  ('Travel', 'plane', '#2563EB'),
  ('Shopping', 'shopping-bag', '#7C3AED'),
  ('Subscriptions', 'repeat', '#DB2777')
on conflict (name) do nothing;

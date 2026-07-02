create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_filename text,
  storage_path text,
  mime_type text,
  file_size bigint,
  processing_status text not null default 'uploaded'
    check (processing_status in ('uploaded','processing','completed','failed')),
  raw_ocr_text text,
  merchant_name text,
  transaction_date date,
  subtotal numeric(12,2),
  tax numeric(12,2),
  total numeric(12,2),
  currency char(3),
  category text,
  ai_summary text,
  embedding vector(1536),
  ocr_provider text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.receipts add column if not exists original_filename text;
alter table public.receipts add column if not exists processing_status text not null default 'uploaded';
alter table public.receipts add column if not exists raw_ocr_text text;
alter table public.receipts add column if not exists merchant_name text;
alter table public.receipts add column if not exists transaction_date date;
alter table public.receipts add column if not exists subtotal numeric(12,2);
alter table public.receipts add column if not exists tax numeric(12,2);
alter table public.receipts add column if not exists ai_summary text;
alter table public.receipts add column if not exists embedding vector(1536);
alter table public.receipts add column if not exists ocr_provider text;
alter table public.receipts add column if not exists error_message text;

create table if not exists public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  quantity numeric(12,3),
  unit_price numeric(12,2),
  total numeric(12,2),
  created_at timestamptz not null default now()
);

create index if not exists receipt_items_receipt_id_idx on public.receipt_items(receipt_id);
create index if not exists receipt_items_user_id_idx on public.receipt_items(user_id);
create index if not exists receipts_processing_status_idx on public.receipts(processing_status);

alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

drop policy if exists "Users read own receipt items" on public.receipt_items;
drop policy if exists "Users insert own receipt items" on public.receipt_items;
drop policy if exists "Users update own receipt items" on public.receipt_items;
drop policy if exists "Users delete own receipt items" on public.receipt_items;

create policy "Users read own receipt items" on public.receipt_items
for select using (auth.uid() = user_id);

create policy "Users insert own receipt items" on public.receipt_items
for insert with check (auth.uid() = user_id);

create policy "Users update own receipt items" on public.receipt_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users delete own receipt items" on public.receipt_items
for delete using (auth.uid() = user_id);


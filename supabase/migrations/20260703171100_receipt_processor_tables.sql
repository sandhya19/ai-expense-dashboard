create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Existing dashboard columns. Keep defaults so service-created rows remain
  -- compatible with the current Next.js dashboard.
  merchant text not null default 'Processing receipt',
  receipt_date date not null default current_date,
  category text not null default 'Uncategorised',
  total numeric(12,2) not null default 0 check (total >= 0),
  currency char(3) not null default 'GBP',
  confidence smallint not null default 0 check (confidence between 0 and 100),
  status text not null default 'processing'
    check (status in ('processing','review','completed','failed')),
  is_business boolean not null default false,
  storage_path text,
  raw_extraction jsonb not null default '{}'::jsonb,

  -- Receipt processor columns.
  original_filename text,
  mime_type text,
  file_size bigint,
  processing_status text not null default 'uploaded'
    check (processing_status in ('uploaded','processing','completed','failed')),
  raw_ocr_text text,
  merchant_name text,
  transaction_date date,
  subtotal numeric(12,2),
  tax numeric(12,2),
  ai_summary text,
  embedding vector(1536),
  ocr_provider text,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.receipts alter column merchant set default 'Processing receipt';
alter table public.receipts alter column receipt_date set default current_date;
alter table public.receipts alter column category set default 'Uncategorised';
alter table public.receipts alter column total set default 0;
alter table public.receipts alter column currency set default 'GBP';
alter table public.receipts alter column confidence set default 0;
alter table public.receipts alter column status set default 'processing';
alter table public.receipts alter column is_business set default false;
alter table public.receipts alter column raw_extraction set default '{}'::jsonb;

alter table public.receipts add column if not exists original_filename text;
alter table public.receipts add column if not exists mime_type text;
alter table public.receipts add column if not exists file_size bigint;
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_processing_status_check'
      and conrelid = 'public.receipts'::regclass
  ) then
    alter table public.receipts
      add constraint receipts_processing_status_check
      check (processing_status in ('uploaded','processing','completed','failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_id_user_id_key'
      and conrelid = 'public.receipts'::regclass
  ) then
    alter table public.receipts
      add constraint receipts_id_user_id_key unique (id, user_id);
  end if;
end $$;

create table if not exists public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  quantity numeric(12,3),
  unit_price numeric(12,2),
  total numeric(12,2),
  created_at timestamptz not null default now(),
  constraint receipt_items_receipt_owner_fk
    foreign key (receipt_id, user_id)
    references public.receipts(id, user_id)
    on delete cascade
);

create index if not exists receipts_processing_status_idx
  on public.receipts(processing_status);
create index if not exists receipts_user_processing_status_idx
  on public.receipts(user_id, processing_status);
create index if not exists receipt_items_receipt_id_idx
  on public.receipt_items(receipt_id);
create index if not exists receipt_items_user_id_idx
  on public.receipt_items(user_id);

alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

drop policy if exists "Users read own receipt items" on public.receipt_items;
drop policy if exists "Users insert own receipt items" on public.receipt_items;
drop policy if exists "Users update own receipt items" on public.receipt_items;
drop policy if exists "Users delete own receipt items" on public.receipt_items;

create policy "Users read own receipt items" on public.receipt_items
for select
using (
  exists (
    select 1
    from public.receipts
    where receipts.id = receipt_items.receipt_id
      and receipts.user_id = auth.uid()
  )
);

create policy "Users insert own receipt items" on public.receipt_items
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.receipts
    where receipts.id = receipt_items.receipt_id
      and receipts.user_id = auth.uid()
  )
);

create policy "Users update own receipt items" on public.receipt_items
for update
using (
  exists (
    select 1
    from public.receipts
    where receipts.id = receipt_items.receipt_id
      and receipts.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.receipts
    where receipts.id = receipt_items.receipt_id
      and receipts.user_id = auth.uid()
  )
);

create policy "Users delete own receipt items" on public.receipt_items
for delete
using (
  exists (
    select 1
    from public.receipts
    where receipts.id = receipt_items.receipt_id
      and receipts.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own receipt files" on storage.objects;
drop policy if exists "Users read own receipt files" on storage.objects;
drop policy if exists "Users update own receipt files" on storage.objects;
drop policy if exists "Users delete own receipt files" on storage.objects;
drop policy if exists "Users can upload their own receipts" on storage.objects;
drop policy if exists "Users can view their own receipts" on storage.objects;
drop policy if exists "Users can update their own receipts" on storage.objects;
drop policy if exists "Users can delete their own receipts" on storage.objects;

create policy "Users upload own receipt files" on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users read own receipt files" on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update own receipt files" on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete own receipt files" on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

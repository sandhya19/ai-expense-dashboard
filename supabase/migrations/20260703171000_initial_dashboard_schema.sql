create extension if not exists pgcrypto;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant text not null,
  receipt_date date not null,
  category text not null default 'Uncategorised',
  total numeric(12,2) not null default 0 check (total >= 0),
  currency char(3) not null default 'GBP',
  confidence smallint not null default 0 check (confidence between 0 and 100),
  status text not null default 'processing' check (status in ('processing','review','completed','failed')),
  is_business boolean not null default false,
  storage_path text,
  raw_extraction jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists receipts_user_date_idx on public.receipts (user_id, receipt_date desc);
create index if not exists receipts_user_category_idx on public.receipts (user_id, category);

alter table public.receipts enable row level security;

drop policy if exists "Users read own receipts" on public.receipts;
drop policy if exists "Users insert own receipts" on public.receipts;
drop policy if exists "Users update own receipts" on public.receipts;
drop policy if exists "Users delete own receipts" on public.receipts;

create policy "Users read own receipts" on public.receipts for select using (auth.uid() = user_id);
create policy "Users insert own receipts" on public.receipts for insert with check (auth.uid() = user_id);
create policy "Users update own receipts" on public.receipts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own receipts" on public.receipts for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own receipt files" on storage.objects;
drop policy if exists "Users read own receipt files" on storage.objects;
drop policy if exists "Users delete own receipt files" on storage.objects;

create policy "Users upload own receipt files" on storage.objects for insert to authenticated
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users read own receipt files" on storage.objects for select to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own receipt files" on storage.objects for delete to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);



create policy "Users can upload their own receipts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own receipts"
on storage.objects
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

create policy "Users can delete their own receipts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);
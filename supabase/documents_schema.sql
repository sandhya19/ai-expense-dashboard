
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists documents_user_id_idx
on public.documents(user_id);

alter table public.documents
alter column user_id set not null;

alter table public.documents enable row level security;

create policy "Users can view their own documents"
on public.documents
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "Users can create their own documents"
on public.documents
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "Users can update their own documents"
on public.documents
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "Users can delete their own documents"
on public.documents
for delete
to authenticated
using (
  auth.uid() = user_id
);
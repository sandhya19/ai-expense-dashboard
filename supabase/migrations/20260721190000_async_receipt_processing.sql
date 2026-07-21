-- Durable work queue for the FastAPI receipt-processor worker.
create table if not exists public.receipt_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null unique references public.receipts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists receipt_processing_jobs_ready_idx
  on public.receipt_processing_jobs (status, run_after, created_at);
create index if not exists receipt_processing_jobs_receipt_id_idx
  on public.receipt_processing_jobs (receipt_id);

alter table public.receipt_processing_jobs enable row level security;

-- Job rows are service-role managed. Users receive status through their own
-- receipt record and cannot inspect another user's failures or queue state.

create or replace function public.claim_receipt_processing_job(lock_seconds integer)
returns setof public.receipt_processing_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_id uuid;
begin
  select id into claimed_id
  from public.receipt_processing_jobs
  where (status = 'queued' and run_after <= now())
     or (status = 'processing' and locked_until <= now())
  order by run_after, created_at
  for update skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  return query
  update public.receipt_processing_jobs
  set status = 'processing',
      attempt_count = attempt_count + 1,
      locked_at = now(),
      locked_until = now() + make_interval(secs => lock_seconds),
      updated_at = now()
  where id = claimed_id
  returning *;
end;
$$;

revoke all on function public.claim_receipt_processing_job(integer) from public;
grant execute on function public.claim_receipt_processing_job(integer) to service_role;

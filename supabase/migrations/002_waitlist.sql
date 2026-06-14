create table if not exists public.waitlist_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.waitlist_emails enable row level security;

-- Only service role can read/write (no user access needed)
create policy "service_role_only" on public.waitlist_emails
  using (false);

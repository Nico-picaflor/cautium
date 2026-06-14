-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  full_name text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vendors (third parties)
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  website text,
  industry text,
  risk_tier text check (risk_tier in ('critical', 'high', 'medium', 'low')),
  risk_score integer check (risk_score between 0 and 100),
  status text not null default 'active' check (status in ('active', 'inactive', 'under_review')),
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table documents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  name text not null,
  type text not null check (type in ('contract', 'policy', 'certificate', 'report', 'other')),
  storage_path text not null,
  file_size integer,
  mime_type text,
  ai_summary text,
  ai_risks jsonb default '[]',
  ai_analyzed_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Questionnaires
create table questionnaires (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'in_progress', 'completed', 'expired')),
  due_date timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Questions
create table questions (
  id uuid primary key default uuid_generate_v4(),
  questionnaire_id uuid not null references questionnaires(id) on delete cascade,
  text text not null,
  type text not null check (type in ('text', 'yes_no', 'multiple_choice', 'scale', 'file')),
  options jsonb default '[]',
  required boolean not null default true,
  order_index integer not null default 0,
  category text,
  created_at timestamptz not null default now()
);

-- Answers
create table answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references questions(id) on delete cascade,
  questionnaire_id uuid not null references questionnaires(id) on delete cascade,
  response_value text,
  response_json jsonb,
  file_path text,
  submitted_by text,
  ai_flag text check (ai_flag in ('ok', 'warning', 'critical')),
  ai_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS Policies
alter table organizations enable row level security;
alter table users enable row level security;
alter table vendors enable row level security;
alter table documents enable row level security;
alter table questionnaires enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;

-- Users can read their own org
create policy "users_read_own_org" on organizations
  for select using (
    id in (select organization_id from users where id = auth.uid())
  );

-- Users can read/write within their org
create policy "users_select_own" on users
  for select using (organization_id in (
    select organization_id from users where id = auth.uid()
  ));

create policy "vendors_org_access" on vendors
  for all using (organization_id in (
    select organization_id from users where id = auth.uid()
  ));

create policy "documents_org_access" on documents
  for all using (organization_id in (
    select organization_id from users where id = auth.uid()
  ));

create policy "questionnaires_org_access" on questionnaires
  for all using (organization_id in (
    select organization_id from users where id = auth.uid()
  ));

create policy "questions_via_questionnaire" on questions
  for all using (questionnaire_id in (
    select id from questionnaires where organization_id in (
      select organization_id from users where id = auth.uid()
    )
  ));

create policy "answers_via_questionnaire" on answers
  for all using (questionnaire_id in (
    select id from questionnaires where organization_id in (
      select organization_id from users where id = auth.uid()
    )
  ));

-- Triggers for updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at before update on organizations
  for each row execute function update_updated_at();
create trigger users_updated_at before update on users
  for each row execute function update_updated_at();
create trigger vendors_updated_at before update on vendors
  for each row execute function update_updated_at();
create trigger documents_updated_at before update on documents
  for each row execute function update_updated_at();
create trigger questionnaires_updated_at before update on questionnaires
  for each row execute function update_updated_at();
create trigger answers_updated_at before update on answers
  for each row execute function update_updated_at();

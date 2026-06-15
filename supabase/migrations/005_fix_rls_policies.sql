-- ============================================================
-- Fix RLS policies — production-grade, non-circular
-- ============================================================

-- Helper: get current user's org_id without circular reference
create or replace function public.current_org_id()
returns uuid language sql stable security definer
set search_path = public as $$
  select organization_id from public.users where id = auth.uid()
$$;

-- ── organizations ──────────────────────────────────────────
drop policy if exists "users_read_own_org" on organizations;

create policy "org_members_select" on organizations
  for select using (id = public.current_org_id());

create policy "org_members_update" on organizations
  for update using (id = public.current_org_id());

-- ── users ──────────────────────────────────────────────────
drop policy if exists "users_select_own" on users;

-- Each user can read their own row (non-circular — uses auth.uid() directly)
create policy "users_select_self" on users
  for select using (id = auth.uid());

-- Users in the same org can see each other
create policy "users_select_org" on users
  for select using (organization_id = public.current_org_id());

create policy "users_update_self" on users
  for update using (id = auth.uid());

-- ── vendors ────────────────────────────────────────────────
drop policy if exists "vendors_org_access" on vendors;

create policy "vendors_org_select" on vendors
  for select using (organization_id = public.current_org_id());

create policy "vendors_org_insert" on vendors
  for insert with check (organization_id = public.current_org_id());

create policy "vendors_org_update" on vendors
  for update using (organization_id = public.current_org_id());

create policy "vendors_org_delete" on vendors
  for delete using (organization_id = public.current_org_id());

-- ── documents ──────────────────────────────────────────────
drop policy if exists "documents_org_access" on documents;

create policy "documents_org_select" on documents
  for select using (organization_id = public.current_org_id());

create policy "documents_org_insert" on documents
  for insert with check (organization_id = public.current_org_id());

create policy "documents_org_update" on documents
  for update using (organization_id = public.current_org_id());

create policy "documents_org_delete" on documents
  for delete using (organization_id = public.current_org_id());

-- ── questionnaires ─────────────────────────────────────────
drop policy if exists "questionnaires_org_access" on questionnaires;

create policy "questionnaires_org_select" on questionnaires
  for select using (organization_id = public.current_org_id());

create policy "questionnaires_org_insert" on questionnaires
  for insert with check (organization_id = public.current_org_id());

create policy "questionnaires_org_update" on questionnaires
  for update using (organization_id = public.current_org_id());

create policy "questionnaires_org_delete" on questionnaires
  for delete using (organization_id = public.current_org_id());

-- ── questions ──────────────────────────────────────────────
drop policy if exists "questions_via_questionnaire" on questions;

create policy "questions_org_select" on questions
  for select using (
    questionnaire_id in (
      select id from questionnaires where organization_id = public.current_org_id()
    )
  );

create policy "questions_org_insert" on questions
  for insert with check (
    questionnaire_id in (
      select id from questionnaires where organization_id = public.current_org_id()
    )
  );

create policy "questions_org_update" on questions
  for update using (
    questionnaire_id in (
      select id from questionnaires where organization_id = public.current_org_id()
    )
  );

-- ── answers ────────────────────────────────────────────────
drop policy if exists "answers_via_questionnaire" on answers;

create policy "answers_org_select" on answers
  for select using (
    questionnaire_id in (
      select id from questionnaires where organization_id = public.current_org_id()
    )
  );

create policy "answers_org_insert" on answers
  for insert with check (
    questionnaire_id in (
      select id from questionnaires where organization_id = public.current_org_id()
    )
  );

create policy "answers_org_update" on answers
  for update using (
    questionnaire_id in (
      select id from questionnaires where organization_id = public.current_org_id()
    )
  );

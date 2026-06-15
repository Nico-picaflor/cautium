-- Migration 006: TPRM product fields (Fase 3)
-- Run this in Supabase SQL Editor

-- Documents: humanized name, framework mapping, validity date
alter table public.documents
  add column if not exists display_name text,
  add column if not exists frameworks text[] default '{}',
  add column if not exists valid_until date;

-- Questionnaires: standard label (SIG, CAIQ, VSA…) and due date
alter table public.questionnaires
  add column if not exists standard text,
  add column if not exists due_date date;

-- Questions: audit trail (who approved, when)
alter table public.questions
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists approved_at timestamptz;

-- Users: preferred language (for i18n)
alter table public.users
  add column if not exists preferred_language text default 'es';

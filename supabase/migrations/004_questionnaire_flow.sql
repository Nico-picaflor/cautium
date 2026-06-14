-- Knowledge base: store extracted text from documents
alter table documents add column if not exists extracted_text text;
alter table documents add column if not exists uploaded_by uuid references users(id) on delete set null;

-- Fix column name inconsistency (schema uses created_by, upload route uses uploaded_by)
alter table documents rename column created_by to uploaded_by_old;
alter table documents add column if not exists created_by uuid references users(id) on delete set null;

-- Questionnaires: track client name and source file
alter table questionnaires add column if not exists client_name text;
alter table questionnaires add column if not exists source_file_path text;
alter table questionnaires add column if not exists total_questions integer default 0;
alter table questionnaires add column if not exists answered_questions integer default 0;

-- Questions: AI + human answer fields
alter table questions add column if not exists ai_answer text;
alter table questions add column if not exists ai_confidence text check (ai_confidence in ('high', 'medium', 'low'));
alter table questions add column if not exists ai_source text;
alter table questions add column if not exists human_answer text;
alter table questions add column if not exists approved boolean default false;
alter table questions add column if not exists category text;

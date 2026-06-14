-- Create storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their org's folder
create policy "org members can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents');

-- Allow authenticated users to read their org's files
create policy "org members can read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');

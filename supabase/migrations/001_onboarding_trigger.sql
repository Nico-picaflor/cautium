-- Trigger: auto-create organization + user profile on auth.users INSERT
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id  uuid;
  v_org_name text;
  v_org_slug text;
begin
  -- derive org name from metadata or email domain
  v_org_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'org_name'), ''),
    split_part(new.email, '@', 2)
  );

  -- build a unique slug: slugified-name-XXXXXXXX
  v_org_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substring(replace(new.id::text, '-', ''), 1, 8);

  -- create organization
  insert into public.organizations (name, slug)
  values (v_org_name, v_org_slug)
  returning id into v_org_id;

  -- create user profile (owner of that org)
  insert into public.users (id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    'owner'
  );

  return new;
end;
$$;

-- drop if re-running migration
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

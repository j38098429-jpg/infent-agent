-- One authoritative website profile per Auth account. No passwords are copied.
begin;
create table if not exists public.infent_profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  registered_at timestamptz not null,
  last_login_at timestamptz,
  email_confirmed_at timestamptz,
  softr_record_id text,
  revision bigint not null default 1,
  synced_revision bigint not null default 0,
  sync_token uuid,
  sync_locked_until timestamptz,
  sync_error text
);
alter table public.infent_profiles enable row level security;
revoke all on public.infent_profiles from anon, authenticated;
grant all on public.infent_profiles to service_role;

create or replace function public.mirror_infent_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.infent_profiles (auth_user_id, name, email, registered_at, last_login_at, email_confirmed_at)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 80), lower(new.email), new.created_at, new.last_sign_in_at, new.email_confirmed_at)
  on conflict (auth_user_id) do update set
    name = excluded.name, email = excluded.email,
    last_login_at = excluded.last_login_at, email_confirmed_at = excluded.email_confirmed_at,
    revision = public.infent_profiles.revision + 1;
  return new;
end;
$$;
revoke all on function public.mirror_infent_auth_user() from public, anon, authenticated;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'infent_auth_profile' and tgrelid = 'auth.users'::regclass) then
    create trigger infent_auth_profile after insert or update of email, raw_user_meta_data, last_sign_in_at, email_confirmed_at
    on auth.users for each row execute function public.mirror_infent_auth_user();
  end if;
end $$;

-- Persist leases in Postgres, not in a serverless process's memory.
create or replace function public.claim_infent_softr_sync(target_user uuid)
returns setof public.infent_profiles language sql security definer set search_path = '' as $$
  update public.infent_profiles set sync_token = gen_random_uuid(), sync_locked_until = now() + interval '2 minutes'
  where auth_user_id = target_user and revision > synced_revision
    and (sync_locked_until is null or sync_locked_until < now())
  returning *;
$$;

create or replace function public.finish_infent_softr_sync(target_user uuid, lease_token uuid, record_id text, synced_version bigint)
returns void language sql security definer set search_path = '' as $$
  update public.infent_profiles set softr_record_id = record_id,
    synced_revision = greatest(synced_revision, synced_version), sync_token = null, sync_locked_until = null, sync_error = null
  where auth_user_id = target_user and sync_token = lease_token;
$$;

create or replace function public.release_infent_softr_sync(target_user uuid, lease_token uuid, error_code text)
returns void language sql security definer set search_path = '' as $$
  update public.infent_profiles set sync_token = null, sync_locked_until = null, sync_error = left(error_code, 100)
  where auth_user_id = target_user and sync_token = lease_token;
$$;

revoke all on function public.claim_infent_softr_sync(uuid) from public, anon, authenticated;
revoke all on function public.finish_infent_softr_sync(uuid, uuid, text, bigint) from public, anon, authenticated;
revoke all on function public.release_infent_softr_sync(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_infent_softr_sync(uuid) to service_role;
grant execute on function public.finish_infent_softr_sync(uuid, uuid, text, bigint) to service_role;
grant execute on function public.release_infent_softr_sync(uuid, uuid, text) to service_role;

create or replace function public.pending_infent_softr_sync()
returns table (auth_user_id uuid) language sql security definer set search_path = '' as $$
  select auth_user_id from public.infent_profiles
  where revision > synced_revision and (sync_locked_until is null or sync_locked_until < now())
    and (sync_error is distinct from 'WAITING_FOR_EMAIL_VERIFICATION' or email_confirmed_at is not null)
  order by registered_at limit 10;
$$;
revoke all on function public.pending_infent_softr_sync() from public, anon, authenticated;
grant execute on function public.pending_infent_softr_sync() to service_role;

-- Safe to run when a project already contains Auth accounts.
insert into public.infent_profiles (auth_user_id, name, email, registered_at, last_login_at, email_confirmed_at)
select id, left(coalesce(raw_user_meta_data ->> 'name', ''), 80), lower(email), created_at, last_sign_in_at, email_confirmed_at
from auth.users where email is not null on conflict (auth_user_id) do nothing;
commit;

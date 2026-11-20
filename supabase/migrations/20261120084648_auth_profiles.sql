create schema private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 12),
  tagline text not null default '' check (char_length(tagline) <= 40)
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select (id, nickname, tagline) on table public.profiles to anon, authenticated;
grant update (nickname, tagline) on table public.profiles to authenticated;

-- Public display fields are readable even without an account. The Auth ID is not.
create policy profiles_read_display on public.profiles
  for select to anon, authenticated
  using (true);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The Auth ID comes from the inserted Auth row, never from signup metadata.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, nickname)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''), '여행자')
  );
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- The public profile UUID differs from the Auth UUID. Only return the caller's.
create function public.my_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.profiles where user_id = (select auth.uid());
$$;
revoke all on function public.my_profile_id() from public, anon, authenticated;
grant execute on function public.my_profile_id() to authenticated;

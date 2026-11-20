-- Fictional profiles have no Auth account. Ownership and demo provenance are exclusive.
alter table public.profiles alter column user_id drop not null;
alter table public.profiles
  add column demo_batch text,
  add column is_example boolean generated always as (demo_batch is not null) stored,
  add column look jsonb not null default '{}'::jsonb,
  add constraint profiles_real_or_demo check ((user_id is null) = (demo_batch is not null)),
  add constraint profiles_look_shape check (jsonb_typeof(look) = 'object' and octet_length(look::text) <= 2048);
grant select (is_example, look) on table public.profiles to anon, authenticated;
grant update (look) on table public.profiles to authenticated;

create table public.stars (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index stars_profile_created on public.stars(profile_id, created_at);
alter table public.stars enable row level security;
revoke all on public.stars from public, anon, authenticated;
grant select on public.stars to anon, authenticated;
grant insert (profile_id, body) on public.stars to authenticated;
grant delete on public.stars to authenticated;
create policy stars_read on public.stars for select to anon, authenticated using (true);
create policy stars_insert_own on public.stars for insert to authenticated
  with check (profile_id = (select public.my_profile_id()));
create policy stars_delete_own on public.stars for delete to authenticated
  using (profile_id = (select public.my_profile_id()));

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  star_id uuid not null references public.stars(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid,
  body text not null check (char_length(btrim(body)) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (star_id, id),
  foreign key (star_id, parent_id) references public.comments(star_id, id) on delete set null (parent_id)
);
create index comments_profile on public.comments(profile_id);
create index comments_parent on public.comments(star_id, parent_id);
alter table public.comments enable row level security;
revoke all on public.comments from public, anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (star_id, profile_id, parent_id, body) on public.comments to authenticated;
create policy comments_read on public.comments for select to anon, authenticated using (true);
create policy comments_insert_own on public.comments for insert to authenticated
  with check (profile_id = (select public.my_profile_id()));

-- Reparent replies atomically, including replies by other users. No client DELETE grant.
create function public.delete_own_comment(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := public.my_profile_id();
  target public.comments;
begin
  if owner_id is null then raise insufficient_privilege; end if;
  select * into target from public.comments where id = target_id for update;
  if not found then return; end if;
  if target.profile_id <> owner_id then raise insufficient_privilege; end if;
  update public.comments set parent_id = target.parent_id
    where star_id = target.star_id and parent_id = target.id;
  delete from public.comments where id = target.id;
end;
$$;
revoke all on function public.delete_own_comment(uuid) from public, anon, authenticated;
grant execute on function public.delete_own_comment(uuid) to authenticated;

create table public.reactions (
  star_id uuid not null references public.stars(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('empathy', 'cheer', 'metoo', 'hug', 'sparkle')),
  primary key (star_id, profile_id, kind)
);
create index reactions_profile on public.reactions(profile_id);
alter table public.reactions enable row level security;
-- Raw rows are deliberately not exposed, including to logged-in visitors.
revoke all on public.reactions from public, anon, authenticated;

create function public.star_reaction_summary(target_id uuid)
returns table(kind text, total bigint, mine boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select r.kind, count(*), coalesce(bool_or(r.profile_id = (select public.my_profile_id())), false)
  from public.reactions r where r.star_id = target_id group by r.kind;
$$;
revoke all on function public.star_reaction_summary(uuid) from public, anon, authenticated;
grant execute on function public.star_reaction_summary(uuid) to anon, authenticated;

create function public.toggle_own_reaction(target_id uuid, reaction_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare owner_id uuid := public.my_profile_id();
begin
  if owner_id is null then raise insufficient_privilege; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_id::text || ':' || owner_id::text || ':' || reaction_kind, 0));
  delete from public.reactions where star_id = target_id and profile_id = owner_id and kind = reaction_kind;
  if not found then
    insert into public.reactions(star_id, profile_id, kind) values (target_id, owner_id, reaction_kind);
  end if;
end;
$$;
revoke all on function public.toggle_own_reaction(uuid, text) from public, anon, authenticated;
grant execute on function public.toggle_own_reaction(uuid, text) to authenticated;

-- Identity tags are sensitive: the owner reads everything, others only what the owner chose to show.
create table private.profile_identities (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  ids text[] not null default '{}',
  other text not null default '',
  visible boolean not null default false,
  constraint identity_ids_known check (ids <@ array[
    'trans-woman','trans-man','transgender','nonbinary','genderfluid','agender',
    'demigirl','demiboy','androgyne','neutrois','other']::text[]),
  constraint identity_ids_count check (cardinality(ids) <= 2),
  constraint identity_other_length check (char_length(other) <= 12),
  -- Free text exists exactly when 'other' is chosen.
  constraint identity_other_matches check ((('other' = any(ids)) = (btrim(other) <> '')))
);

create function public.my_identity()
returns table(ids text[], other text, visible boolean)
language sql stable security definer set search_path = '' as $$
  select i.ids, i.other, i.visible from private.profile_identities i
    where i.profile_id = (select public.my_profile_id());
$$;

create function public.save_my_identity(identity_ids text[], identity_other text, show_identity boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := private.require_active_profile();
begin
  perform 1 from public.profiles where id = owner_id for update;
  if (select count(*) from unnest(coalesce(identity_ids, '{}')) u) <> (select count(distinct u) from unnest(coalesce(identity_ids, '{}')) u) then
    raise check_violation using message = 'IDENTITY_DUPLICATE';
  end if;
  insert into private.profile_identities(profile_id, ids, other, visible)
  values (owner_id, coalesce(identity_ids, '{}'),
    case when 'other' = any(coalesce(identity_ids, '{}')) then btrim(coalesce(identity_other, '')) else '' end,
    coalesce(show_identity, false))
  on conflict (profile_id) do update set
    ids = excluded.ids, other = excluded.other, visible = excluded.visible;
end;
$$;

-- Hidden identities return no row at all.
create function public.public_identities(profile_ids uuid[])
returns table(profile_id uuid, ids text[], other text)
language sql stable security definer set search_path = '' as $$
  select i.profile_id, i.ids, i.other from private.profile_identities i
    where i.profile_id = any(coalesce(profile_ids, '{}')) and i.visible and cardinality(i.ids) > 0
    limit 200;
$$;

revoke all on function public.my_identity(), public.save_my_identity(text[], text, boolean), public.public_identities(uuid[]) from public, anon, authenticated;
grant execute on function public.my_identity(), public.save_my_identity(text[], text, boolean) to authenticated;
grant execute on function public.public_identities(uuid[]) to anon, authenticated;

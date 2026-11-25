-- Select exact matches before sampling, and return the same match tiers to the client.
drop function public.similar_profiles();
create function public.similar_profiles()
returns table(id uuid, nickname text, tagline text, is_example boolean, look jsonb,
  ids text[], other text, shared text[], all_match boolean)
language sql volatile security definer set search_path = '' as $$
  select p.id, p.nickname, p.tagline, p.is_example, p.look, i.ids, i.other,
    matches.shared, cardinality(matches.shared) = cardinality(mine.ids)
  from private.profile_identities mine
  join private.profile_identities i on i.visible and i.profile_id <> mine.profile_id and i.ids && mine.ids
  join public.profiles p on p.id = i.profile_id
  cross join lateral (
    select array_agg(tag.id order by tag.position) as shared
    from unnest(mine.ids) with ordinality as tag(id, position)
    where tag.id = any(i.ids)
      and (tag.id <> 'other' or lower(btrim(i.other) collate pg_catalog."und-x-icu")
        = lower(btrim(mine.other) collate pg_catalog."und-x-icu"))
  ) matches
  where mine.profile_id = (select public.my_profile_id())
    and matches.shared is not null
  order by random()
  limit 60;
$$;
revoke all on function public.similar_profiles() from public, anon, authenticated;
grant execute on function public.similar_profiles() to authenticated;

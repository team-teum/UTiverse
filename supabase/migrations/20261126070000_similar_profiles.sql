-- 「닮은 별 찾기」: shown identities of other profiles that share at least one item with mine.
-- My own identity is compared even when hidden; it is never returned to anyone.
create function public.similar_profiles()
returns table(id uuid, nickname text, tagline text, is_example boolean, look jsonb, ids text[], other text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.nickname, p.tagline, p.is_example, p.look, i.ids, i.other
  from private.profile_identities i
  join public.profiles p on p.id = i.profile_id
  join private.profile_identities mine on mine.profile_id = (select public.my_profile_id())
  where i.visible and i.profile_id <> mine.profile_id and i.ids && mine.ids
  order by random()
  limit 60;
$$;
revoke all on function public.similar_profiles() from public, anon, authenticated;
grant execute on function public.similar_profiles() to authenticated;

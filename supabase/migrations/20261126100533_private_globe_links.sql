-- Only surviving comments on each other's posts count. Never accept a viewer ID.
create function public.my_globe_links() returns uuid[]
language sql stable security invoker set search_path = ''
as $$
  with viewer as (select public.my_profile_id() as id)
  select array(
    select s.profile_id
    from viewer v
    join public.comments c on c.profile_id = v.id
    join public.stars s on s.id = c.star_id
    where s.profile_id <> v.id
    intersect
    select c.profile_id
    from viewer v
    join public.stars s on s.profile_id = v.id
    join public.comments c on c.star_id = s.id
  )
$$;

revoke all on function public.my_globe_links() from public, anon;
grant execute on function public.my_globe_links() to authenticated;

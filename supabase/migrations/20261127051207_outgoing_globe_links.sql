-- Only count the caller's surviving comments on other people's posts.
-- Replacing the function preserves the existing authenticated-only grants.
create or replace function public.my_globe_links() returns uuid[]
language sql stable security invoker set search_path = ''
as $$
  with viewer as (select public.my_profile_id() as id)
  select array(
    select distinct s.profile_id
    from viewer v
    join public.comments c on c.profile_id = v.id
    join public.stars s on s.id = c.star_id
    where s.profile_id <> v.id
  )
$$;

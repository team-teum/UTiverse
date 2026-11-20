-- Run only as a database operator after reviewing the batch. Never run from the app.
begin;
set local utiverse.demo_batch = 'sandbox-neighbors';
lock table public.profiles, public.stars, public.comments, public.reactions, public.reports in share row exclusive mode;

do $$
declare batch text := current_setting('utiverse.demo_batch');
begin
  if exists (select 1
    from public.stars s join public.profiles p on p.id = s.profile_id
    join public.comments c on c.star_id = s.id
    join public.profiles author on author.id = c.profile_id
    where p.demo_batch = batch and author.demo_batch is distinct from batch)
  or exists (select 1
    from public.stars s join public.profiles p on p.id = s.profile_id
    join public.reactions r on r.star_id = s.id
    join public.profiles author on author.id = r.profile_id
    where p.demo_batch = batch and author.demo_batch is distinct from batch)
  or exists (select 1
    from public.comments c join public.profiles p on p.id = c.profile_id
    join public.comments reply on reply.parent_id = c.id
    join public.profiles author on author.id = reply.profile_id
    where p.demo_batch = batch and author.demo_batch is distinct from batch)
  or exists (select 1
    from public.reports r
    left join public.stars s on s.id = r.star_id
    left join public.comments c on c.id = r.comment_id
    left join public.stars parent_star on parent_star.id = c.star_id
    join public.profiles target on target.id in (s.profile_id, c.profile_id, parent_star.profile_id)
    join public.profiles reporter on reporter.id = r.reporter_id
    where target.demo_batch = batch and reporter.demo_batch is distinct from batch) then
    raise exception 'Demo batch % has activity from outside the batch; review it before removing the batch', batch;
  end if;

  delete from public.profiles where user_id is null and demo_batch = batch;
end;
$$;

commit;

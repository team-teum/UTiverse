-- No history or statistical retention. Remove earlier soft-deleted rows too.
delete from private.profile_locations where not active;

create or replace function public.save_my_location(region_sido text, region_sigungu text, share_location boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := private.require_active_profile();
begin
  perform 1 from public.profiles where id = owner_id for update;
  if not exists (select 1 from private.valid_regions where sido = region_sido and sigungu = region_sigungu) then
    raise check_violation using message = 'INVALID_REGION';
  end if;
  insert into private.profile_locations(profile_id, sido, sigungu, visible)
  values (owner_id, region_sido, region_sigungu, share_location)
  on conflict (profile_id) do update set sido = excluded.sido, sigungu = excluded.sigungu,
    visible = excluded.visible, active = true, changed_at = now();
end;
$$;

create or replace function public.delete_my_location()
returns void language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := private.require_active_profile();
begin
  perform 1 from public.profiles where id = owner_id for update;
  delete from private.profile_locations where profile_id = owner_id;
end;
$$;

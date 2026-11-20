-- Check the actual stored length and the same whitespace-only cases as JS trim.
create function private.has_display_text(value text) returns boolean
language sql immutable strict set search_path = '' as $$
  select btrim(value, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') <> '';
$$;
revoke all on function private.has_display_text(text) from public;
grant execute on function private.has_display_text(text) to authenticated;
alter table public.profiles add constraint nickname_stored_length check (char_length(nickname) <= 12 and private.has_display_text(nickname));
alter table public.stars add constraint star_stored_length check (char_length(body) <= 500 and private.has_display_text(body));
alter table public.comments add constraint comment_stored_length check (char_length(body) <= 200 and private.has_display_text(body));

-- Revocation is durable: lifting a suspension doesn't restore the old opt-in.
create function private.withdraw_nearby_visibility() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.profiles where id = new.profile_id for update;
  update private.profile_locations set visible = false where profile_id = new.profile_id;
  return new;
end;
$$;
revoke all on function private.withdraw_nearby_visibility() from public, anon, authenticated;
create trigger withdraw_on_suspension after insert or update of suspended on private.account_controls
  for each row when (new.suspended) execute function private.withdraw_nearby_visibility();
update private.profile_locations l set visible = false from private.account_controls c
  where c.profile_id = l.profile_id and c.suspended;

-- Recheck after acquiring the same profile lock used by suspension. This also
-- covers an in-flight location registration that started before suspension.
create function private.guard_location_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.visible then
    perform 1 from public.profiles where id = new.profile_id for update;
    if exists (select 1 from private.account_controls where profile_id = new.profile_id and suspended) then
      raise insufficient_privilege using message = 'ACCOUNT_SUSPENDED';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_location_write() from public, anon, authenticated;
create trigger guard_location_visibility before insert or update on private.profile_locations
  for each row execute function private.guard_location_write();

create or replace function public.share_my_location(share_location boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := private.require_active_profile();
begin
  perform 1 from public.profiles where id = owner_id for update;
  update private.profile_locations set visible = share_location where profile_id = owner_id and active;
end;
$$;

-- Sample the whole eligible population before limiting the API response.
create function public.random_cards(card_count int)
returns table(id uuid, nickname text, tagline text, is_example boolean, look jsonb, latest_star text)
language sql volatile security definer set search_path = '' as $$
  select p.id, p.nickname, p.tagline, p.is_example, p.look,
    (select split_part(s.body, E'\n', 1) from public.stars s where s.profile_id = p.id
     order by s.created_at desc, s.id desc limit 1)
  from (select x.id, x.nickname, x.tagline, x.is_example, x.look from public.profiles x
    where x.id is distinct from (select public.my_profile_id())
    order by random() limit greatest(0, least(coalesce(card_count, 0), 4))) p;
$$;
revoke all on function public.random_cards(int) from public, anon, authenticated;
grant execute on function public.random_cards(int) to anon, authenticated;

-- Private controls also protect writes from JWTs issued before a suspension.
create table private.account_controls (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  suspended boolean not null default true
);
create function private.reject_suspended_writer()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from private.account_controls where profile_id = public.my_profile_id() and suspended) then
    raise insufficient_privilege using message = 'ACCOUNT_SUSPENDED';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.reject_suspended_writer() from public, anon, authenticated;
create trigger profiles_active_writer before update on public.profiles
  for each row execute function private.reject_suspended_writer();
create trigger stars_active_writer before insert or delete on public.stars
  for each row execute function private.reject_suspended_writer();
create trigger comments_active_writer before insert or update or delete on public.comments
  for each row execute function private.reject_suspended_writer();
create trigger reactions_active_writer before insert or delete on public.reactions
  for each row execute function private.reject_suspended_writer();

create function private.require_active_profile()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare owner_id uuid := public.my_profile_id();
begin
  if owner_id is null then raise insufficient_privilege; end if;
  if exists (select 1 from private.account_controls where profile_id = owner_id and suspended) then
    raise insufficient_privilege using message = 'ACCOUNT_SUSPENDED';
  end if;
  return owner_id;
end;
$$;
revoke all on function private.require_active_profile() from public, anon, authenticated;

create table private.tutorial_progress (
  profile_id uuid primary key references public.profiles(id) on delete cascade
);
create function public.my_tutorial_done()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.tutorial_progress where profile_id = (select public.my_profile_id()));
$$;
create function public.complete_my_tutorial()
returns void language sql security definer set search_path = '' as $$
  insert into private.tutorial_progress values (private.require_active_profile()) on conflict do nothing;
$$;
revoke all on function public.my_tutorial_done(), public.complete_my_tutorial() from public, anon, authenticated;
grant execute on function public.my_tutorial_done(), public.complete_my_tutorial() to authenticated;

create table private.valid_regions (
  sido text not null,
  sigungu text not null,
  primary key (sido, sigungu)
);
create table private.profile_locations (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  sido text not null,
  sigungu text not null,
  active boolean not null default true,
  visible boolean not null default false,
  changed_at timestamptz not null default now(),
  foreign key (sido, sigungu) references private.valid_regions(sido, sigungu)
);
create index profile_locations_region on private.profile_locations(sido, sigungu);
create table private.nearby_calls (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  bucket timestamptz not null,
  calls int not null
);

create function public.my_location()
returns table(sido text, sigungu text, visible boolean)
language sql stable security definer set search_path = '' as $$
  select l.sido, l.sigungu, l.visible from private.profile_locations l
    where l.profile_id = (select public.my_profile_id()) and l.active;
$$;
create function public.save_my_location(region_sido text, region_sigungu text, share_location boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := private.require_active_profile();
  previous private.profile_locations;
begin
  -- Serialize changes, including first registration and deletion, for this profile.
  perform 1 from public.profiles where id = owner_id for update;
  if not exists (select 1 from private.valid_regions where sido = region_sido and sigungu = region_sigungu) then
    raise check_violation using message = 'INVALID_REGION';
  end if;
  select * into previous from private.profile_locations where profile_id = owner_id;
  if found and (previous.sido, previous.sigungu) <> (region_sido, region_sigungu)
    and previous.changed_at > now() - interval '7 days' then
    raise check_violation using message = 'REGION_CHANGE_LIMIT';
  end if;
  insert into private.profile_locations(profile_id, sido, sigungu, visible)
  values (owner_id, region_sido, region_sigungu, share_location)
  on conflict (profile_id) do update set
    sido = excluded.sido, sigungu = excluded.sigungu, active = true, visible = excluded.visible,
    changed_at = case when (previous.sido, previous.sigungu) = (region_sido, region_sigungu)
      then previous.changed_at else excluded.changed_at end;
end;
$$;
create function public.delete_my_location()
returns void language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := private.require_active_profile();
begin
  perform 1 from public.profiles where id = owner_id for update;
  update private.profile_locations set active = false, visible = false where profile_id = owner_id;
end;
$$;
create function public.share_my_location(share_location boolean)
returns void language sql security definer set search_path = '' as $$
  update private.profile_locations set visible = share_location
    where profile_id = private.require_active_profile() and active;
$$;
create function public.nearby_profiles()
returns table(id uuid, nickname text, tagline text, is_example boolean, look jsonb, tier text)
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := private.require_active_profile();
  mine private.profile_locations;
  call_count int;
begin
  select * into mine from private.profile_locations where profile_id = owner_id and active;
  if not found then return; end if;
  insert into private.nearby_calls as history (profile_id, bucket, calls)
  values (owner_id, date_trunc('minute', now()), 1)
  on conflict (profile_id) do update set
    calls = case when history.bucket = excluded.bucket then history.calls + 1 else 1 end,
    bucket = excluded.bucket
  returning calls into call_count;
  if call_count > 10 then raise raise_exception using message = 'NEARBY_RATE_LIMIT'; end if;
  return query
    with candidates as (
      select p.id, p.nickname, p.tagline, p.is_example, p.look,
        case when l.sido = mine.sido and l.sigungu = mine.sigungu then 1
             when l.sido = mine.sido then 2 else 3 end as distance_rank
      from private.profile_locations l join public.profiles p on p.id = l.profile_id
      where l.profile_id <> owner_id and l.active and l.visible
    ), ranked as (
      select c.*, row_number() over (partition by distance_rank order by random()) as n from candidates c
    )
    select r.id, r.nickname, r.tagline, r.is_example, r.look,
      (array['sigungu', 'sido', 'nation'])[distance_rank]
    from ranked r where n <= 2 order by distance_rank, n;
end;
$$;
revoke all on function public.my_location(), public.save_my_location(text,text,boolean), public.delete_my_location(), public.share_my_location(boolean), public.nearby_profiles() from public, anon, authenticated;
grant execute on function public.my_location(), public.save_my_location(text,text,boolean), public.delete_my_location(), public.share_my_location(boolean), public.nearby_profiles() to authenticated;

create table public.events (
  id text primary key,
  title text not null,
  date date not null,
  end_date date check (end_date >= date),
  time text,
  place text not null,
  host text not null,
  description text not null,
  tags text[] not null default '{}',
  link jsonb,
  is_example boolean not null default false
);
alter table public.events enable row level security;
revoke all on table public.events from public, anon, authenticated;
grant select on table public.events to anon, authenticated;
create policy events_read on public.events for select to anon, authenticated using (true);

create table public.event_bookmarks (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_id text not null references public.events(id) on delete cascade,
  primary key (profile_id, event_id)
);
create index event_bookmarks_event on public.event_bookmarks(event_id);
alter table public.event_bookmarks enable row level security;
revoke all on table public.event_bookmarks from public, anon, authenticated;
grant select (event_id) on table public.event_bookmarks to authenticated;
create policy event_bookmarks_read_own on public.event_bookmarks for select to authenticated
  using (profile_id = (select public.my_profile_id()));
create function public.toggle_my_bookmark(target_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := private.require_active_profile();
begin
  perform 1 from public.profiles where id = owner_id for update;
  delete from public.event_bookmarks where profile_id = owner_id and event_id = target_id;
  if not found then insert into public.event_bookmarks values (owner_id, target_id); end if;
end;
$$;
revoke all on function public.toggle_my_bookmark(text) from public, anon, authenticated;
grant execute on function public.toggle_my_bookmark(text) to authenticated;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  star_id uuid references public.stars(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (reason in ('괴롭힘·혐오', '개인정보 노출', '스팸', '기타')),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check (num_nonnulls(star_id, comment_id) = 1)
);
create unique index reports_one_per_star on public.reports(reporter_id, star_id) where star_id is not null;
create unique index reports_one_per_comment on public.reports(reporter_id, comment_id) where comment_id is not null;
create index reports_star on public.reports(star_id);
create index reports_comment on public.reports(comment_id);
create index reports_reporter on public.reports(reporter_id);
alter table public.reports enable row level security;
revoke all on table public.reports from public, anon, authenticated;
grant select (id, star_id, comment_id, reason, status, created_at) on table public.reports to authenticated;
create policy reports_read_own on public.reports for select to authenticated
  using (reporter_id = (select public.my_profile_id()));
create function public.submit_report(target_star uuid, target_comment uuid, report_reason text)
returns void language sql security definer set search_path = '' as $$
  insert into public.reports (reporter_id, star_id, comment_id, reason)
  values (private.require_active_profile(), target_star, target_comment, report_reason)
  on conflict do nothing;
$$;
revoke all on function public.submit_report(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.submit_report(uuid,uuid,text) to authenticated;

-- Region labels mirror web/src/lib/regions.ts so the database rejects invented pairs.
insert into private.valid_regions(sido, sigungu)
select region.sido, sub.name from jsonb_each('{"서울특별시":["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"],"부산광역시":["강서구","금정구","기장군","남구","동구","동래구","부산진구","북구","사상구","사하구","서구","수영구","연제구","영도구","중구","해운대구"],"대구광역시":["군위군","남구","달서구","달성군","동구","북구","서구","수성구","중구"],"인천광역시":["강화군","계양구","남동구","동구","미추홀구","부평구","서구","연수구","옹진군","중구"],"광주광역시":["광산구","남구","동구","북구","서구"],"대전광역시":["대덕구","동구","서구","유성구","중구"],"울산광역시":["남구","동구","북구","울주군","중구"],"세종특별자치시":["세종시"],"경기도":["가평군","고양시","과천시","광명시","광주시","구리시","군포시","김포시","남양주시","동두천시","부천시","성남시","수원시","시흥시","안산시","안성시","안양시","양주시","양평군","여주시","연천군","오산시","용인시","의왕시","의정부시","이천시","파주시","평택시","포천시","하남시","화성시"],"강원특별자치도":["강릉시","고성군","동해시","삼척시","속초시","양구군","양양군","영월군","원주시","인제군","정선군","철원군","춘천시","태백시","평창군","홍천군","화천군","횡성군"],"충청북도":["괴산군","단양군","보은군","영동군","옥천군","음성군","제천시","증평군","진천군","청주시","충주시"],"충청남도":["계룡시","공주시","금산군","논산시","당진시","보령시","부여군","서산시","서천군","아산시","예산군","천안시","청양군","태안군","홍성군"],"전북특별자치도":["고창군","군산시","김제시","남원시","무주군","부안군","순창군","완주군","익산시","임실군","장수군","전주시","정읍시","진안군"],"전라남도":["강진군","고흥군","곡성군","광양시","구례군","나주시","담양군","목포시","무안군","보성군","순천시","신안군","여수시","영광군","영암군","완도군","장성군","장흥군","진도군","함평군","해남군","화순군"],"경상북도":["경산시","경주시","고령군","구미시","김천시","문경시","봉화군","상주시","성주군","안동시","영덕군","영양군","영주시","영천시","예천군","울릉군","울진군","의성군","청도군","청송군","칠곡군","포항시"],"경상남도":["거제시","거창군","고성군","김해시","남해군","밀양시","사천시","산청군","양산시","의령군","진주시","창녕군","창원시","통영시","하동군","함안군","함양군","합천군"],"제주특별자치도":["서귀포시","제주시"]}'::jsonb) as region(sido, districts)
cross join lateral jsonb_array_elements_text(region.districts) as sub(name);

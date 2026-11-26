-- 「아직 탐색 중」 (요청 019): its own identity item that stands alone, and tags are shown by default.
alter table private.profile_identities
  drop constraint identity_ids_known,
  add constraint identity_ids_known check (ids <@ array[
    'trans-woman','trans-man','transgender','nonbinary','genderfluid','agender',
    'demigirl','demiboy','androgyne','neutrois','other','exploring']::text[]),
  add constraint identity_exploring_alone check (not ('exploring' = any(ids)) or cardinality(ids) = 1),
  alter column visible set default true;

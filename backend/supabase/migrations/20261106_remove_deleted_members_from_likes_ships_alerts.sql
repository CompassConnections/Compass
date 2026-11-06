-- Stop keeping a deleted member's id in other members' rows.
-- Created: 2026-11-06
--
-- `delete-me` removes the users row and relies on the foreign keys to clear the rest, but these
-- columns had none, so the id outlived the account:
--
--   profile_likes.target_id                  cascade: a like of someone who left means nothing.
--   profile_ships.target1_id, target2_id     cascade: likewise a ship naming them.
--   search_alert_sends.matched_user_ids      an array, so no foreign key can cover it: `delete-me`
--                                            removes the id itself and adds to deleted_match_count.
--
-- deleted_match_count is what keeps get-search-alert's goneCount right. It used to be derived from
-- the ids that no longer resolve, and an alert that comes up short must still say why.
--
-- Safe to re-run: the orphans have to go before the constraints can be added.

delete from profile_likes l
where not exists (select 1 from users u where u.id = l.target_id);

delete from profile_ships s
where not exists (select 1 from users u where u.id = s.target1_id)
   or not exists (select 1 from users u where u.id = s.target2_id);

alter table profile_likes
    drop constraint if exists profile_likes_target_id_fkey;
alter table profile_likes
    add constraint profile_likes_target_id_fkey
        foreign key (target_id) references users (id) on delete cascade;

alter table profile_ships
    drop constraint if exists profile_ships_target1_id_fkey;
alter table profile_ships
    add constraint profile_ships_target1_id_fkey
        foreign key (target1_id) references users (id) on delete cascade;

alter table profile_ships
    drop constraint if exists profile_ships_target2_id_fkey;
alter table profile_ships
    add constraint profile_ships_target2_id_fkey
        foreign key (target2_id) references users (id) on delete cascade;

alter table search_alert_sends
    add column if not exists deleted_match_count integer not null default 0;

-- Members who left before this migration.
update search_alert_sends s
set matched_user_ids    = kept.ids,
    deleted_match_count = s.deleted_match_count + cardinality(s.matched_user_ids) - cardinality(kept.ids)
from (select a.id,
             coalesce(array_agg(m.user_id order by m.position) filter (where u.id is not null),
                      '{}') as ids
      from search_alert_sends a
               cross join lateral unnest(a.matched_user_ids) with ordinality as m(user_id, position)
               left join users u on u.id = m.user_id
      group by a.id) kept
where kept.id = s.id
  and cardinality(kept.ids) < cardinality(s.matched_user_ids);

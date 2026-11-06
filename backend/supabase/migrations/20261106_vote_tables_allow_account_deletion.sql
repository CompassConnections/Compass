-- Let an account be deleted when its owner has voted or posted a proposal.
-- Created: 2026-11-06
--
-- `delete-me` removes the users row and relies on the foreign keys to clear the rest. These two were
-- the only ones pointing at users with no delete rule, so the delete errored and the account stayed.
--
--   vote_results.user_id   cascade: a ballot is personal data, and it leaves the tally with its owner.
--   votes.creator_id       set null: other members' ballots and comments hang off the proposal, and
--                          deleting one account should not delete those. The proposal stays, without
--                          an author, the same way causes, interests and compatibility prompts do.

alter table votes
    alter column creator_id drop not null;

alter table votes
    drop constraint if exists votes_creator_id_fkey;
alter table votes
    add constraint votes_creator_id_fkey
        foreign key (creator_id) references users (id) on delete set null;

alter table vote_results
    drop constraint if exists vote_results_user_id_fkey;
alter table vote_results
    add constraint vote_results_user_id_fkey
        foreign key (user_id) references users (id) on delete cascade;

-- Unique indexes in prod that repeat another one on the same table. Each costs a little on every write. No
-- foreign key uses any of the ones dropped here.
--
-- Not here: users_id_key and profiles_id_key also repeat their primary keys, but 59 and 3 foreign keys are
-- attached to them, so dropping them means recreating those foreign keys.

-- interests: both repeat the stricter unique index on lower(name), which is what upserts target.
alter table interests drop constraint if exists name_unique;
alter table interests drop constraint if exists interests_name_unique2;

-- private_users: repeats private_users_pkey.
alter table private_users drop constraint if exists private_users_id_key;

-- private_user_message_channels: the primary key is called private_user_message_channels_pkey1, next to a plain
-- unique index that took the usual name. Drop the plain one and give the primary key its name back.
drop index if exists private_user_message_channels_pkey;
alter table private_user_message_channels
    rename constraint private_user_message_channels_pkey1 to private_user_message_channels_pkey;

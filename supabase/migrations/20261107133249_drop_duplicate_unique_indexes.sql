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
-- unique index that took the usual name. Keep whichever one the foreign keys use, and make it the primary key
-- named private_user_message_channels_pkey. On prod they use the plain index; on a database rebuilt from the
-- baseline they use the primary key. If they are split between the two, this fails rather than drop either.
do
$$
    begin
        if exists (select 1
                   from pg_constraint
                   where conrelid = 'private_user_message_channels'::regclass
                     and conname = 'private_user_message_channels_pkey1') then
            if exists (select 1
                       from pg_constraint
                       where contype = 'f'
                         and conindid = 'private_user_message_channels_pkey1'::regclass) then
                drop index if exists private_user_message_channels_pkey;
                alter table private_user_message_channels
                    rename constraint private_user_message_channels_pkey1 to private_user_message_channels_pkey;
            else
                alter table private_user_message_channels
                    drop constraint private_user_message_channels_pkey1;
                alter table private_user_message_channels
                    add constraint private_user_message_channels_pkey primary key using index private_user_message_channels_pkey;
            end if;
        end if;
    end
$$;

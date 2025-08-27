update private_user_messages
set created_time = now() where created_time is null;

alter table private_user_messages
alter column created_time set not null,
alter column created_time set default now(),
alter column visibility set not null,
alter column visibility set default 'private',
alter column user_id set not null,
alter column content set not null,
alter column channel_id set not null;

alter table private_user_messages
rename column id to old_id;

alter table private_user_messages
add column id bigint generated always as identity primary key;


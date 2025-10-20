
-- Copy data into tables 
insert into
  users (data, id, name, username, created_time)
select
  user_data, id, name, username, created_time
from
  temp_users;

insert into
  private_users (data, id)
select
  private_user_data, id
from
  temp_users;

-- alter table private_user_messages
-- alter column channel_id set not null,
-- alter column content set not null,
-- alter column created_time set not null,
-- alter column created_time set default now(),
-- alter column id set not null,
-- alter column user_id set not null,
-- alter column visibility set not null,
-- alter column visibility set default 'private';

-- alter table private_user_messages
-- alter column id add generated always as identity;

-- alter table private_user_messages
-- add constraint private_user_messages_pkey primary key (id);

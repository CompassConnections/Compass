create table if not exists
  contact (
    id text default uuid_generate_v4 () not null,
    created_time timestamp with time zone default now(),
    user_id text,
    content jsonb
  );

-- Foreign Keys
alter table contact
add constraint contact_user_id_fkey foreign key (user_id) references users (id);

-- Row Level Security
alter table contact enable row level security;

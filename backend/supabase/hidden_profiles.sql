create table if not exists hidden_profiles
(
    id             BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_time   timestamptz                         not null default now(),
    hider_user_id  TEXT                                not null,
    hidden_user_id TEXT                                not null
);

-- Row Level Security
ALTER TABLE hidden_profiles
    ENABLE ROW LEVEL SECURITY;

-- Ensure a user can only hide another user once (idempotent)
create unique index if not exists hidden_profiles_unique_hider_hidden
    on hidden_profiles (hider_user_id, hidden_user_id);

-- Helpful indexes
create index if not exists hidden_profiles_hider_idx on hidden_profiles (hider_user_id);
create index if not exists hidden_profiles_hidden_idx on hidden_profiles (hidden_user_id);

-- Optional FKs to users table if present in schema
alter table hidden_profiles
    add constraint fk_hidden_profiles_hider
        foreign key (hider_user_id) references users (id) on delete cascade;
alter table hidden_profiles
    add constraint fk_hidden_profiles_hidden
        foreign key (hidden_user_id) references users (id) on delete cascade;

CREATE TABLE IF NOT EXISTS private_user_message_channel_members (
    channel_id BIGINT NOT NULL,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    notify_after_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    role TEXT DEFAULT 'member'::TEXT NOT NULL,
    status TEXT DEFAULT 'proposed'::TEXT NOT NULL,
    user_id TEXT NOT NULL,
    CONSTRAINT private_user_message_channel_members_pkey PRIMARY KEY (id)
    );

-- Foreign Keys
ALTER TABLE private_user_message_channel_members
    ADD CONSTRAINT private_user_message_channel_members_user_id_fkey
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'channel_id_fkey'
          AND conrelid = 'private_user_message_channel_members'::regclass
    ) THEN
        ALTER TABLE private_user_message_channel_members
            ADD CONSTRAINT channel_id_fkey
                FOREIGN KEY (channel_id)
                    REFERENCES private_user_message_channels (id)
                    ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END$$;

-- Row Level Security
ALTER TABLE private_user_message_channel_members ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS pumcm_members_idx
    ON public.private_user_message_channel_members
    USING btree (channel_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_channel
    ON public.private_user_message_channel_members
    USING btree (channel_id, user_id);

-- Functions
create
    or replace function public.can_access_private_messages(channel_id bigint, user_id text) returns boolean
    language sql
    parallel SAFE as
$function$
select exists (select 1
               from private_user_message_channel_members
               where private_user_message_channel_members.channel_id = $1
                 and private_user_message_channel_members.user_id = $2)
$function$;

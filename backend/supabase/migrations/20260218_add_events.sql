-- Create events table
CREATE TABLE IF NOT EXISTS events
(
    id               text                 default uuid_generate_v4() not null primary key,
    created_time     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_id       TEXT        REFERENCES users (id) ON DELETE SET NULL,
    title            TEXT        NOT NULL,
    description      TEXT,
    location_type    TEXT        NOT NULL CHECK (location_type IN ('in_person', 'online')),
    location_address TEXT,
    location_url     TEXT,
    event_start_time TIMESTAMPTZ NOT NULL,
    event_end_time   TIMESTAMPTZ,
    is_public        BOOLEAN     NOT NULL DEFAULT TRUE,
    max_participants INTEGER,
    status           TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed'))
);

-- Create events_participants table
CREATE TABLE IF NOT EXISTS events_participants
(
    id        text                 default uuid_generate_v4() not null primary key,
    event_id  TEXT        NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    user_id   TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rsvp_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status    TEXT        NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
    UNIQUE (event_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_creator ON events (creator_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (event_start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON events (status);
CREATE INDEX IF NOT EXISTS idx_events_participants_event ON events_participants (event_id);
CREATE INDEX IF NOT EXISTS idx_events_participants_user ON events_participants (user_id);

-- Enable RLS
ALTER TABLE events
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_participants
    ENABLE ROW LEVEL SECURITY;

-- Events policies
-- Anyone can view public events
DROP POLICY IF EXISTS "events select" ON events;
CREATE POLICY "events select" ON events
    FOR SELECT USING (is_public = TRUE);

-- Events participants policies
-- Anyone can view participants for public events
DROP POLICY IF EXISTS "events_participants select" ON events_participants;
CREATE POLICY "events_participants select" ON events_participants
    FOR SELECT USING (
    EXISTS (SELECT 1
            FROM events e
            WHERE e.id = events_participants.event_id
              AND e.is_public = TRUE)
    );

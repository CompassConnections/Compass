-- 1. Drop the old column
alter table lovers drop column if exists bio;

-- 2. Add the new column as jsonb
alter table lovers add column bio jsonb;

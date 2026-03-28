ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wheel_cache jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wheel_cache_at timestamptz;
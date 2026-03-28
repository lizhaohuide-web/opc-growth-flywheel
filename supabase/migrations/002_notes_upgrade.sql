-- 笔记质量评分
ALTER TABLE notes ADD COLUMN IF NOT EXISTS quality_score integer;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS quality_dimensions jsonb;
-- 收藏
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorited boolean DEFAULT false;
-- AI 摘要（可能已存在）
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_summary_at timestamptz;
-- 给 notes 表添加 AI 改写缓存字段
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_rewrites jsonb DEFAULT '{}';

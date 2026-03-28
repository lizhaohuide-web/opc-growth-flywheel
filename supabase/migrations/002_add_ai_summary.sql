-- OPC 增长飞轮 - 数据库更新脚本
-- 在 Supabase Dashboard → SQL Editor 执行

-- 为 notes 表添加 AI 摘要字段
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_summary_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_knowledge_links JSONB DEFAULT '[]';

-- 添加索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_notes_ai_summary ON notes(id) WHERE ai_summary IS NOT NULL;

-- 更新 RLS 策略（允许用户更新自己的笔记摘要）
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

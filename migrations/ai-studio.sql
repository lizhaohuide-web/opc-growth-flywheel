-- AI Studio Module Database Migration
-- Creates new tables for AI-generated content, publications, and feedback loops
-- Does not affect existing tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. AI 生成版本表 (AI Versions)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL,
  platform TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  prompt TEXT,
  style TEXT,
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(note_id, platform, version)
);

-- Indexes for ai_versions
CREATE INDEX IF NOT EXISTS idx_ai_versions_note ON ai_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_ai_versions_platform ON ai_versions(platform);
CREATE INDEX IF NOT EXISTS idx_ai_versions_user ON ai_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_versions_created ON ai_versions(created_at DESC);

-- ============================================
-- 2. 公众号发布表 (WeChat Publications)
-- ============================================
CREATE TABLE IF NOT EXISTS wechat_publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL,
  version_id UUID REFERENCES ai_versions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT,
  cover_image_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  publication_url TEXT,
  stats JSONB DEFAULT '{"read": 0, "like": 0, "share": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for wechat_publications
CREATE INDEX IF NOT EXISTS idx_wechat_pubs_note ON wechat_publications(note_id);
CREATE INDEX IF NOT EXISTS idx_wechat_pubs_status ON wechat_publications(status);
CREATE INDEX IF NOT EXISTS idx_wechat_pubs_user ON wechat_publications(user_id);

-- ============================================
-- 3. 小红书发布表 (Xiaohongshu Publications)
-- ============================================
CREATE TABLE IF NOT EXISTS xiaohongshu_publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL,
  version_id UUID REFERENCES ai_versions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  title TEXT,
  image_prompts JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  publication_url TEXT,
  stats JSONB DEFAULT '{"like": 0, "collect": 0, "comment": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for xiaohongshu_publications
CREATE INDEX IF NOT EXISTS idx_xhs_pubs_note ON xiaohongshu_publications(note_id);
CREATE INDEX IF NOT EXISTS idx_xhs_pubs_status ON xiaohongshu_publications(status);
CREATE INDEX IF NOT EXISTS idx_xhs_pubs_user ON xiaohongshu_publications(user_id);

-- ============================================
-- 4. 短视频项目表 (Short Video Projects)
-- ============================================
CREATE TABLE IF NOT EXISTS short_video_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL,
  version_id UUID REFERENCES ai_versions(id) ON DELETE SET NULL,
  tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'advanced', 'pro')),
  style TEXT CHECK (style IN ('talk', 'entertainment', 'sales')),
  script TEXT NOT NULL,
  audio JSONB DEFAULT '{}'::jsonb,
  broll JSONB DEFAULT '{"prompts": [], "images": [], "videoClips": []}'::jsonb,
  digital_human JSONB DEFAULT '{"workflowUrl": null, "provider": null}'::jsonb,
  status TEXT NOT NULL DEFAULT 'script' CHECK (status IN ('script', 'audio', 'visual', 'rendering', 'complete')),
  video_url TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for short_video_projects
CREATE INDEX IF NOT EXISTS idx_video_projects_note ON short_video_projects(note_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_tier ON short_video_projects(tier);
CREATE INDEX IF NOT EXISTS idx_video_projects_status ON short_video_projects(status);
CREATE INDEX IF NOT EXISTS idx_video_projects_user ON short_video_projects(user_id);

-- ============================================
-- 5. 播客节目表 (Podcast Episodes)
-- ============================================
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL,
  version_id UUID REFERENCES ai_versions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  script TEXT NOT NULL,
  host_a JSONB DEFAULT '{"name": "主持人 A", "role": "专业/理性"}'::jsonb,
  host_b JSONB DEFAULT '{"name": "主持人 B", "role": "好奇/提问"}'::jsonb,
  audio_url TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'script' CHECK (status IN ('script', 'audio', 'complete')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for podcast_episodes
CREATE INDEX IF NOT EXISTS idx_podcast_note ON podcast_episodes(note_id);
CREATE INDEX IF NOT EXISTS idx_podcast_status ON podcast_episodes(status);
CREATE INDEX IF NOT EXISTS idx_podcast_user ON podcast_episodes(user_id);

-- ============================================
-- 6. 数据反馈表 (Feedback Loops)
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_loops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL,
  platform TEXT NOT NULL,
  publication_id UUID NOT NULL,
  publication_type TEXT NOT NULL CHECK (publication_type IN ('wechat', 'xiaohongshu', 'short_video', 'podcast')),
  metrics JSONB DEFAULT '{"views": 0, "likes": 0, "comments": 0, "shares": 0}'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  applied_to_note BOOLEAN DEFAULT FALSE,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for feedback_loops
CREATE INDEX IF NOT EXISTS idx_feedback_note ON feedback_loops(note_id);
CREATE INDEX IF NOT EXISTS idx_feedback_platform ON feedback_loops(platform);
CREATE INDEX IF NOT EXISTS idx_feedback_pub ON feedback_loops(publication_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback_loops(user_id);

-- ============================================
-- 7. 平台配置表 (Platform Configs) - Optional reference table
-- ============================================
CREATE TABLE IF NOT EXISTS platform_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  max_versions INTEGER DEFAULT 3,
  prompt_template TEXT,
  style_options JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform configs
INSERT INTO platform_configs (name, display_name, icon, max_versions, style_options) VALUES
  ('wechat', '公众号', '📝', 3, '["专业", "温暖", "科技感"]'::jsonb),
  ('xiaohongshu', '小红书', '📕', 3, '["清新", "时尚", "实用"]'::jsonb),
  ('wechat_moments', '朋友圈', '💬', 3, '["生活化", "幽默", "金句"]'::jsonb),
  ('short_video', '短视频', '🎬', 3, '["口播", "娱乐", "带货"]'::jsonb),
  ('podcast', '播客', '🎙️', 3, '["专业对话", "轻松闲聊", "深度访谈"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE ai_versions IS 'AI 生成的多版本文案，支持跨平台对比';
COMMENT ON TABLE wechat_publications IS '公众号发布记录，包含配图和数据统计';
COMMENT ON TABLE xiaohongshu_publications IS '小红书发布记录，包含配图提示词和生成图片';
COMMENT ON TABLE short_video_projects IS '短视频项目，支持基础/进阶/高阶三档方案';
COMMENT ON TABLE podcast_episodes IS '播客节目，双人对话脚本和音频';
COMMENT ON TABLE feedback_loops IS '数据反馈闭环，记录各平台表现和优化建议';
COMMENT ON TABLE platform_configs IS '平台配置参考表，定义各平台特性和风格选项';

-- ============================================
-- Row Level Security (RLS) - Optional, enable if using Supabase
-- ============================================
-- Uncomment if using Supabase with RLS enabled
/*
ALTER TABLE ai_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wechat_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiaohongshu_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_loops ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust user_id reference as needed)
CREATE POLICY "Users can view own ai_versions" ON ai_versions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai_versions" ON ai_versions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ai_versions" ON ai_versions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ai_versions" ON ai_versions
  FOR DELETE USING (user_id = auth.uid());

-- Repeat similar policies for other tables...
*/

-- ============================================
-- Migration complete
-- ============================================

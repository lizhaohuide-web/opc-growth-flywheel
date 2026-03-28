# OPC 增长飞轮 - 部署指南

## 🚀 快速部署

### 1. 环境准备

**安装 Node.js 18+**:
```bash
node -v  # 应该 >= 18
```

**安装依赖**:
```bash
cd opc-growth-flywheel
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`:
```bash
cp .env.example .env.local
```

编辑 `.env.local`:
```env
# Supabase 配置（在 https://supabase.com 创建项目）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI API 配置（使用 YibuAPI 或其他）
AI_API_KEY=your-ai-api-key

# 应用配置
NEXT_PUBLIC_APP_NAME=OPC 增长飞轮
```

### 3. 初始化数据库

在 **Supabase Dashboard** → **SQL Editor** 执行：
```sql
-- 运行 supabase/migrations/001_init_schema.sql 内容
```

**创建里程碑表**（可选）:
```sql
CREATE TABLE milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  target_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 0,
  achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones" ON milestones
  FOR SELECT USING (auth.uid() = user_id);
```

**插入预置里程碑**:
```sql
INSERT INTO milestones (name, description, target_count) VALUES
  ('7 天连续记录', '连续 7 天写笔记', 7),
  ('30 天连续记录', '连续 30 天写笔记', 30),
  ('100 篇笔记', '累计写 100 篇笔记', 100);
```

### 4. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 部署到 Vercel

**方式 A: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

**方式 B: GitHub + Vercel**
1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署

**配置环境变量**（Vercel Dashboard）:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AI_API_KEY`

---

## 📁 项目结构

```
opc-growth-flywheel/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   ├── auth/                 # 认证页面
│   ├── dashboard/            # 仪表盘页面
│   └── page.tsx              # 首页
├── components/               # React 组件
│   ├── analytics/            # 分析图表组件
│   ├── auth/                 # 认证组件
│   ├── layout/               # 布局组件
│   ├── milestones/           # 里程碑组件
│   └── notes/                # 笔记组件
├── lib/                      # 工具库
│   ├── ai/                   # AI 客户端
│   ├── analytics/            # 分析逻辑
│   ├── milestones/           # 里程碑追踪
│   ├── supabase/             # Supabase 客户端
│   └── templates/            # 问题模板
├── supabase/                 # Supabase 配置
│   └── migrations/           # 数据库迁移
└── .env.local                # 环境变量（不提交）
```

---

## 🔧 功能清单

### ✅ 已实现功能

**用户系统**
- [x] 注册/登录/登出
- [x] 路由保护中间件
- [x] 用户会话管理

**笔记功能**
- [x] 创建/编辑/删除笔记
- [x] Markdown 编辑器（实时预览）
- [x] 标签系统
- [x] 笔记搜索
- [x] 引导式模板（KPT/CORNELL/ORID/感恩）

**AI 功能**
- [x] 笔记摘要生成
- [x] 智能标签建议
- [x] 公众号文章生成
- [x] 小红书文案生成
- [x] 导出为 Markdown/PDF

**数据分析**
- [x] 仪表盘统计
- [x] 笔记趋势图表
- [x] 标签云
- [x] 周报生成
- [x] 成长雷达图
- [x] 生命之轮评估
- [x] 成就徽章系统

---

## 🎯 下一步优化建议

### 短期（1-2 周）
- [ ] 添加更多问题模板
- [ ] 优化移动端体验
- [ ] 添加笔记分享功能
- [ ] 集成微信登录

### 中期（1-2 月）
- [ ] 添加语音输入
- [ ] 实现笔记双向链接
- [ ] 开发浏览器扩展（网页剪藏）
- [ ] 添加付费订阅系统

### 长期（3-6 月）
- [ ] 开发移动端 App
- [ ] 添加社区功能
- [ ] 实现模板市场
- [ ] 企业版功能

---

## 📞 技术支持

- **GitHub Issues**: 提交 Bug 和功能请求
- **Discord**: 加入社区讨论
- **邮箱**: support@opc-growth.com

---

**版本**: v1.0.0 MVP  
**最后更新**: 2026-03-27

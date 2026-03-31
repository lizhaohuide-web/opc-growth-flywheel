# AI 工作室快速启动指南

## 🚀 5 分钟快速开始

### 第一步：执行数据库迁移（5 分钟）

1. 打开 Supabase SQL Editor 或你的数据库客户端
2. 执行迁移文件：

```bash
# 方式 1：使用 psql 命令行
psql -h <your-db-host> -U postgres -d postgres -f /Users/lizhaohui/.openclaw/workspace/migrations/ai-studio.sql

# 方式 2：在 Supabase Dashboard 的 SQL Editor 中复制粘贴执行
# 文件内容：/workspace/migrations/ai-studio.sql
```

3. 验证表创建成功：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%' OR table_name LIKE 'wechat_%' OR table_name LIKE 'xiaohongshu_%';
```

---

### 第二步：启动开发服务器（1 分钟）

```bash
cd /Users/lizhaohui/.openclaw/workspace
npm run dev
```

访问：http://localhost:3000/dashboard/ai-studio

---

### 第三步：测试核心功能（10 分钟）

#### 3.1 访问 AI 工作室主页
- 导航到左侧菜单 "🤖 AI 工作室"
- 查看平台统计卡片
- 测试搜索和筛选功能

#### 3.2 创建测试版本
1. 点击任意笔记进入详情页
2. 选择平台（如：公众号）
3. 选择风格（如：专业）
4. 点击"生成公众号版本"
5. 查看生成的版本卡片

#### 3.3 测试版本管理
- 复制版本内容
- 重新生成版本
- 删除版本
- 切换视图模式（网格/对比）

---

## 🧪 快速测试脚本

### 测试 API 路由

```bash
# 1. 测试生成版本
curl -X POST http://localhost:3000/api/ai-studio/generate \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "test-note-id",
    "platform": "wechat",
    "style": "专业"
  }'

# 2. 测试获取版本列表
curl http://localhost:3000/api/ai-studio/versions?noteId=test-note-id

# 3. 测试公众号配图生成
curl -X POST http://localhost:3000/api/ai-studio/wechat/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文章标题",
    "content": "测试文章内容...",
    "style": "专业"
  }'

# 4. 测试小红书提示词生成
curl -X POST http://localhost:3000/api/ai-studio/xiaohongshu/generate-prompts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试笔记",
    "content": "测试内容...",
    "style": "清新"
  }'

# 5. 测试短视频脚本生成
curl -X POST http://localhost:3000/api/ai-studio/short-video/generate-script \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试视频",
    "content": "测试内容...",
    "style": "talk",
    "tier": "basic"
  }'

# 6. 测试播客脚本生成
curl -X POST http://localhost:3000/api/ai-studio/podcast/generate-script \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试播客",
    "content": "测试内容...",
    "style": "专业对话"
  }'

# 7. 测试数据分析
curl -X POST http://localhost:3000/api/ai-studio/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "wechat",
    "metrics": {
      "views": 1000,
      "likes": 50,
      "comments": 10,
      "shares": 5
    }
  }'
```

---

## 📁 文件结构总览

```
/workspace/
├── migrations/
│   └── ai-studio.sql              # 数据库迁移脚本
├── app/
│   ├── dashboard/
│   │   └── ai-studio/
│   │       ├── layout.tsx         # 布局
│   │       ├── page.tsx           # 主页
│   │       └── [noteId]/
│   │           └── page.tsx       # 详情页
│   └── api/
│       └── ai-studio/
│           ├── generate/
│           │   └── route.ts       # 生成版本
│           ├── versions/
│           │   ├── route.ts       # 版本列表
│           │   └── [id]/
│           │       └── route.ts   # 单版本操作
│           ├── wechat/
│           │   └── generate-image/
│           │       └── route.ts   # 公众号配图
│           ├── xiaohongshu/
│           │   ├── generate-prompts/
│           │   │   └── route.ts   # 小红书提示词
│           │   └── generate-images/
│           │       └── route.ts   # 小红书图片
│           ├── short-video/
│           │   └── generate-script/
│           │       └── route.ts   # 短视频脚本
│           ├── podcast/
│           │   └── generate-script/
│           │       └── route.ts   # 播客脚本
│           └── analyze/
│               └── route.ts       # 数据分析
└── AI_STUDIO_COMPLETION_REPORT.md  # 完成报告
```

---

## 🔧 常见问题

### Q1: 页面显示"加载中..."无限循环
**A:** 检查 API 是否正常响应，查看浏览器控制台错误信息

### Q2: 生成版本失败
**A:** 当前是模拟实现，需要接入实际 AI API。查看 `/app/api/ai-studio/generate/route.ts` 中的 `generateWithAI()` 函数

### Q3: 数据库表不存在
**A:** 确保已执行迁移脚本，检查数据库连接配置

### Q4: 左侧导航没有 AI 工作室入口
**A:** 检查 `/app/dashboard/layout.tsx` 是否已更新，清除浏览器缓存

---

## 📊 下一步工作清单

### 立即可做
- [ ] 执行数据库迁移
- [ ] 测试所有页面和 API
- [ ] 记录测试中发现的问题

### 本周内
- [ ] 接入实际 AI API（通义千问/GPT-4）
- [ ] 实现真实的数据库 CRUD
- [ ] 添加用户权限控制

### 本月内
- [ ] 接入图像生成服务
- [ ] 接入 TTS 音频生成
- [ ] 实现数据反馈闭环

---

## 📞 需要帮助？

查看详细文档：
- 📋 完整需求：`/workspace/AI_STUDIO_PLAN.md`
- 📦 完成报告：`/workspace/AI_STUDIO_COMPLETION_REPORT.md`
- 🗄️ 数据库迁移：`/workspace/migrations/ai-studio.sql`

---

_最后更新：2026-03-31_
_版本：v1.0_

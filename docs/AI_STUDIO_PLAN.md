# AI 工作室开发方案 v2.0

## 📋 需求总结

### 模块改动
1. **新增微信朋友圈平台** - 在内容生成中增加朋友圈文案输出
2. **优化输出格式** - 各平台输出内容去掉无用的标点符号
3. **新增 AI 工作室模块** - 主页左侧独立大模块，进行深度开发

### 核心功能优先级

#### 已解决 ✅
- 结果不满意可以重新输入

#### 待实现 🎯
1. **多版本对比** - 基于 AI 工作室，不同平台每个平台生成 1-3 个版本可对比
2. **风格定制** - 整合到自定义提示词功能中（进阶功能）
3. **AI 笔记赋能** - 独立大功能模块操作

---

## 🆕 新增需求：全流程多媒体生成

### 最终目标
**笔记 → AI → 新媒体内容 → 数据反馈 → 优化笔记** 完美闭环

### 各平台完整流程

| 平台 | 流程步骤 |
|------|----------|
| **公众号** | 文案改写 → 生成配图 → 发布到公众号 |
| **小红书** | 文案改写 → 生成配图提示词 → 图片生成 → 发布到小红书 |
| **短视频** | 3 套方案（见下方详解） |
| **播客** | 文案改写 → 生成双人对话播客 |
| **朋友圈** | 文案改写 → 可选配图 → 发布 |

---

## 🏗️ 架构设计

### 1. 左侧导航新增
```
导航结构：
- 仪表盘
- 笔记
- 创作
- 🤖 AI 工作室  ← 新增
- 成长
- 订阅
```

### 2. AI 工作室页面结构
```
/app/dashboard/ai-studio/
├── page.tsx              # 主页面（多版本对比视图）
├── layout.tsx            # 布局
└── [noteId]/
    └── page.tsx          # 单笔记 AI 工作室详情页
```

### 3. 多版本对比数据结构
```typescript
interface AIVersion {
  id: string
  noteId: string
  platform: string          // wechat, xiaohongshu, wechat_moments, etc.
  version: number           // 1, 2, 3
  content: string
  prompt: string            // 使用的提示词
  style?: string            // 风格标签
  createdAt: string
  qualityScore?: number     // AI 评分
}

interface PlatformConfig {
  id: string
  name: string
  icon: string
  maxVersions: number       // 3
  promptTemplate: string
  styleOptions?: string[]   // 可选风格
}
```

### 4. 全流程数据结构（新增）
```typescript
// 公众号
interface WechatPublication {
  id: string
  noteId: string
  title: string
  content: string
  coverImage?: string       // 生成的配图
  status: 'draft' | 'published'
  publishedAt?: string
  stats?: { read: number; like: number; share: number }
}

// 小红书
interface XiaohongshuPublication {
  id: string
  noteId: string
  content: string
  imagePrompts: string[]    // 配图提示词数组
  images: string[]          // 生成的图片 URL
  status: 'draft' | 'published'
  stats?: { like: number; collect: number; comment: number }
}

// 短视频
interface ShortVideoProject {
  id: string
  noteId: string
  tier: 'basic' | 'advanced' | 'pro'  // 基础/进阶/高阶
  style?: 'talk' | 'entertainment' | 'sales'  // 口播/娱乐/带货
  script: string            // 改写后的脚本
  audio?: {               // 进阶/高阶用
    voiceModel: string    // 训练好的声音
    audioUrl: string
  }
  broll?: {               // 进阶用
    prompts: string[]
    images: string[]
    videoClips: string[]
  }
  digitalHuman?: {        // 高阶用
    workflowUrl: string   // 外部工作流跳转
    provider: string
  }
  status: 'script' | 'audio' | 'visual' | 'rendering' | 'complete'
}

// 播客
interface PodcastEpisode {
  id: string
  noteId: string
  title: string
  script: string          // 双人对话脚本
  hostA: string           // 主持人 A 设定
  hostB: string           // 主持人 B 设定
  audioUrl?: string
  duration?: number       // 时长（秒）
  status: 'script' | 'audio' | 'complete'
}

// 数据反馈闭环
interface FeedbackLoop {
  noteId: string
  platform: string
  publicationId: string
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    conversion?: number
  }
  insights: string[]      // AI 分析的优化建议
  appliedToNote: boolean  // 是否已反馈到原笔记
}
```

---

## 📝 开发任务清单

### Phase 1: 基础架构 (1-2 天)

#### 1.1 数据库迁移
```sql
-- 新增 AI 生成版本表
CREATE TABLE ai_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  prompt TEXT,
  style TEXT,
  quality_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  UNIQUE(note_id, platform, version)
);

-- 索引
CREATE INDEX idx_ai_versions_note ON ai_versions(note_id);
CREATE INDEX idx_ai_versions_platform ON ai_versions(platform);
```

#### 1.2 API 路由
```
/app/api/ai-studio/
├── generate/route.ts       # 生成新版本
├── versions/route.ts       # 获取某笔记的所有版本
├── compare/route.ts        # 多版本对比
└── platforms/route.ts      # 获取平台配置
```

#### 1.3 新增微信朋友圈平台
修改 `/app/api/generate/route.ts`:
- 添加 `wechat_moments` 平台提示词
- 朋友圈文案特点：短小精悍、生活化、强互动

---

### Phase 1.4: 全流程功能开发 (3-5 天)

#### 1.4.1 公众号全流程
```
流程：文案改写 → 生成配图 → 发布到公众号

API:
POST /api/ai-studio/wechat/generate-image   # 生成配图
POST /api/ai-studio/wechat/publish          # 发布到公众号（需对接公众号 API）

配图生成提示词：
- 根据文章标题和核心观点生成封面图
- 风格：专业/温暖/科技感（可选）
- 尺寸：900x383px（公众号封面标准）
```

#### 1.4.2 小红书全流程
```
流程：文案改写 → 生成配图提示词 → 图片生成 → 发布到小红书

API:
POST /api/ai-studio/xiaohongshu/generate-prompts  # 生成配图提示词（3-5 张）
POST /api/ai-studio/xiaohongshu/generate-images   # 调用绘图模型生成图片
POST /api/ai-studio/xiaohongshu/publish           # 发布到小红书

配图提示词模板：
- 封面图：吸引眼球，含标题文字位置
- 内容图 1-3：展示核心要点/对比/步骤
- 结尾图：引导互动/关注
```

#### 1.4.3 短视频全流程（3 套方案）
```
方案 1 - 基础（人工拍剪）：
流程：选择风格 → 文案改写为脚本 → 导出拍摄提词器
风格选项：口播 / 娱乐 / 带货
输出：分镜脚本 + 提词器文本

方案 2 - 进阶（素材生成）：
流程：文案分析 → 专属音频生成 → B-roll 配图生成 → 自动剪辑
需要：
- 用户训练好的声音模型（对接 ElevenLabs/剪映）
- B-roll 提示词生成
- 视频素材生成/检索（对接 Runway/Pika/素材库）

方案 3 - 高阶（数字人）：
流程：跳转到外部数字人工作流
对接平台：
- 硅基智能
- 闪剪
- HeyGen
- D-ID
输出：工作流 URL + 回调接收成品
```

#### 1.4.4 播客全流程
```
流程：文案改写 → 生成双人对话脚本 → 音频生成

API:
POST /api/ai-studio/podcast/generate-script   # 生成双人对话脚本
POST /api/ai-studio/podcast/generate-audio    # TTS 生成（双人对话）

脚本结构：
- 主持人 A（专业/理性）
- 主持人 B（好奇/提问）
- 自然对话节奏，有互动、有追问

音频生成：
- 对接 ElevenLabs / Azure TTS
- 两个不同声音角色
- 添加背景音乐/音效
```

#### 1.4.5 数据反馈闭环
```
流程：发布后数据拉取 → AI 分析 → 优化建议 → 反馈到笔记

API:
GET  /api/ai-studio/analytics/:platform/:id   # 拉取平台数据
POST /api/ai-studio/analyze-performance       # AI 分析表现
POST /api/ai-studio/apply-insights            # 应用优化建议到原笔记

数据源：
- 公众号：阅读量、在看、分享（需公众号 API）
- 小红书：点赞、收藏、评论（需小红书 API 或手动录入）
- 短视频：播放量、完播率、互动（需平台 API）
- 播客：播放量、订阅数（需播客平台 API）

AI 分析维度：
- 标题吸引力评分
- 内容完读率分析
- 互动触发点识别
- 优化建议生成
```

---

### Phase 2: UI 开发 (2-3 天)

#### 2.1 左侧导航更新
文件：`/app/dashboard/layout.tsx`
```typescript
const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: '◆' },
  { href: '/dashboard/notes', label: '笔记', icon: '▦' },
  { href: '/dashboard/notes/new', label: '创作', icon: '✦' },
  { href: '/dashboard/ai-studio', label: 'AI 工作室', icon: '🤖' },  // 新增
  { href: '/dashboard/reports/growth', label: '成长', icon: '↗' },
  { href: '/dashboard/subscription', label: '订阅', icon: '◇' },
]
```

#### 2.2 AI 工作室主页面
文件：`/app/dashboard/ai-studio/page.tsx`
功能：
- 显示所有笔记的 AI 生成状态
- 快速进入某笔记的多版本对比
- 批量生成/重新生成

#### 2.3 多版本对比视图
文件：`/app/dashboard/ai-studio/[noteId]/page.tsx`
功能：
- 平台选择器（Tab 切换）
- 每个平台显示 1-3 个版本卡片
- 版本间对比（并排/切换视图）
- 一键复制/导出
- "重新生成此版本" 按钮

---

### Phase 3: 风格定制 (1-2 天)

#### 3.1 自定义提示词管理
```typescript
interface StylePreset {
  id: string
  name: string            // "专业严肃", "轻松幽默", "温暖治愈"
  description: string
  promptModifier: string  // 追加到基础提示词的修饰词
  platforms: string[]     // 适用平台
}
```

#### 3.2 提示词编辑器 UI
- 基础提示词模板选择
- 风格修饰词叠加
- 自定义追加指令
- 保存为个人预设

---

### Phase 4: 优化迭代 (1 天)

#### 4.1 输出格式优化
- 去除无用标点符号
- 平台特定格式处理

#### 4.2 性能优化
- 生成结果缓存
- 流式输出优化

---

## 🎨 UI 设计要点

### 多版本对比视图
```
┌─────────────────────────────────────────────────────────────┐
│  AI 工作室 > 笔记标题                              [返回]   │
├─────────────────────────────────────────────────────────────┤
│  平台选择：[公众号] [小红书] [朋友圈] [短视频] [微博]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  版本 1     │  │  版本 2     │  │  版本 3     │        │
│  │  ⭐⭐⭐⭐☆  │  │  ⭐⭐⭐☆☆  │  │  ⭐⭐⭐⭐⭐  │        │
│  │             │  │             │  │             │        │
│  │ 内容预览... │  │ 内容预览... │  │ 内容预览... │        │
│  │             │  │             │  │             │        │
│  │ [复制][导出]│  │ [复制][导出]│  │ [复制][导出]│        │
│  │ [重新生成]  │  │ [重新生成]  │  │ [重新生成]  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  [+ 生成新版本]                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速启动步骤

### 第一步：数据库迁移
```bash
# 在 Supabase SQL Editor 执行迁移脚本
```

### 第二步：添加朋友圈平台
修改 `/app/api/generate/route.ts`，添加：
```typescript
wechat_moments: {
  prompt: `你是一位朋友圈文案高手。请将以下笔记改写成朋友圈文案。

## 朋友圈核心规则
- 前 15 字决定停留（信息流展示限制）
- 生活化 > 营销感
- 互动率 = 评论数 / 曝光数

## 文案结构
[开头] 一句话吸引（15 字内）
[正文] 2-3 句，生活化表达
[结尾] 互动引导/金句收尾

## 格式要求
- 50-150 字
- 适当 emoji（2-4 个）
- 分段清晰，方便阅读
- 去掉无用标点

## 原始笔记
${titleLine}${content.substring(0, 1000)}`,
  systemPrompt: '你是朋友圈文案专家，擅长把复杂内容变成轻松有趣的生活分享。'
}
```

### 第三步：创建 AI 工作室页面
创建 `/app/dashboard/ai-studio/page.tsx`

### 第四步：更新导航
修改 `/app/dashboard/layout.tsx`

---

## 📌 注意事项

1. **API 调用限制** - 每个版本生成独立调用 AI，注意 rate limit
2. **存储成本** - 多版本会占用更多数据库空间，考虑软删除/归档
3. **用户体验** - 生成过程显示进度，支持后台生成
4. **风格预设** - 提供默认风格，允许用户自定义保存

---

## 🔧 外部服务集成清单

### AI 文本生成
| 服务商 | 用途 | 推荐模型 |
|--------|------|----------|
| 通义千问 | 文案改写 | qwen-max, qwen-plus |
| OpenAI | 文案改写 | gpt-4-turbo |
| Anthropic | 长文案 | claude-3-opus |

### 图像生成
| 服务商 | 用途 | 说明 |
|--------|------|------|
| 通义万相 | 公众号封面/小红书配图 | 国内访问快 |
| Midjourney | 高质量配图 | 需 Discord |
| DALL-E 3 | 通用配图 | API 简单 |
| Stable Diffusion | 自建/可控 | 需部署 |

### 音频生成
| 服务商 | 用途 | 说明 |
|--------|------|------|
| ElevenLabs | 播客/短视频配音 | 支持声音克隆 |
| Azure TTS | 播客双人对话 | 多角色支持 |
| 剪映 | 短视频配音 | 中文效果好 |

### 视频生成
| 服务商 | 用途 | 说明 |
|--------|------|------|
| Runway Gen-2 | B-roll 素材 | 文字生成视频 |
| Pika Labs | 短视频素材 | 免费额度 |
| 硅基智能 | 数字人 | 国内服务 |
| HeyGen | 数字人 | 效果好 |
| D-ID | 数字人 | API 友好 |

### 发布平台 API
| 平台 | API 文档 | 难度 |
|------|----------|------|
| 公众号 | https://developers.weixin.qq.com/doc/offiaccount/ | ⭐⭐⭐ |
| 小红书 | 需企业号/第三方服务 | ⭐⭐⭐⭐ |
| 抖音 | https://open.douyin.com/ | ⭐⭐⭐ |
| 视频号 | 微信开放平台 | ⭐⭐⭐ |

---

## 📊 数据反馈闭环架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        完美闭环流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│   │  笔记    │ ──→ │  AI 改写  │ ──→ │  多平台  │              │
│   │  (输入)  │     │ (多版本) │     │  (发布)  │              │
│   └──────────┘     └──────────┘     └──────────┘              │
│        ↑                                   │                   │
│        │                                   ↓                   │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│   │  优化    │ ←──  │  AI 分析  │ ←──  │  数据    │              │
│   │  (行动)  │     │ (洞察)   │     │  (反馈)  │              │
│   └──────────┘     └──────────┘     └──────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

具体实现：
1. 笔记 → AI 改写：现有内容生成 API
2. AI 改写 → 多平台：各平台发布流程
3. 多平台 → 数据：平台 API / 手动录入
4. 数据 → AI 分析：分析 API + 洞察生成
5. AI 分析 → 优化：建议应用到原笔记/新笔记
```

---

## ✅ 验收标准

### Phase 1 - 基础功能
- [ ] 左侧导航显示 AI 工作室入口
- [ ] 朋友圈平台可正常生成
- [ ] 每个平台可生成 1-3 个版本
- [ ] 多版本可并排对比
- [ ] 支持重新生成指定版本
- [ ] 输出内容无多余标点
- [ ] 风格定制可保存到自定义提示词
- [ ] 生成历史记录可追溯

### Phase 2 - 全流程功能
- [ ] 公众号：文案 + 配图生成
- [ ] 小红书：文案 + 配图提示词 + 图片生成
- [ ] 短视频：3 套方案完整流程
  - [ ] 基础：风格选择 + 脚本改写 + 提词器
  - [ ] 进阶：音频生成 + B-roll 配图
  - [ ] 高阶：数字人工作流跳转
- [ ] 播客：双人对话脚本 + 音频生成
- [ ] 数据反馈：手动录入 + AI 分析
- [ ] 优化建议：应用到原笔记

### Phase 3 - 闭环完善
- [ ] 平台 API 对接（公众号/小红书/抖音）
- [ ] 自动数据拉取
- [ ] AI 洞察自动生成
- [ ] 优化建议一键应用

---

## 🎯 开发优先级建议

```
推荐顺序（快速验证 → 深度迭代）：

1. 朋友圈平台 + 导航更新（1 天）← 从这里开始 ✅
   └─ 快速看到效果，验证流程

2. 多版本对比 UI（2 天）
   └─ 核心差异化功能

3. 公众号配图生成（1 天）
   └─ 最简单的全流程验证

4. 小红书配图提示词 + 生成（2 天）
   └─ 高价值功能

5. 短视频基础方案（1 天）
   └─ 提词器脚本改写

6. 播客双人对话（2 天）
   └─ 需要 TTS 对接

7. 短视频进阶/高阶（3-5 天）
   └─ 复杂功能，需外部服务

8. 数据反馈闭环（2-3 天）
   └─ 需要平台 API 或手动录入
```

---

_文档创建时间：2026-03-31_
_更新时间：2026-03-31 v2.0_
_状态：待开发 - 等待确认优先级_

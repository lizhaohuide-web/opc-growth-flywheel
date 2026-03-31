# 朋友圈、短视频、播客平台改写功能实现总结

## 实现时间
2026-04-01

## 实现内容

### 1. API 路由（3 个）

#### `/api/ai-studio/moments/generate/route.ts`
- **功能**: 朋友圈文案生成
- **参数**: `noteId`, `style`
- **风格选项**: 走心感悟、日常分享、鸡汤励志、幽默段子、知识干货
- **输出**: 50-150 字朋友圈文案（含 emoji 和话题标签）

#### `/api/ai-studio/short-video/generate/route.ts`
- **功能**: 短视频脚本生成
- **参数**: `noteId`, `platform`, `videoType`
- **平台选项**: 抖音、视频号、B 站
- **类型选项**: 口播、vlog、教程、故事
- **输出**: JSON 格式（标题、脚本、分镜、字幕、标签、BGM 建议、封面建议）

#### `/api/ai-studio/podcast/generate/route.ts`
- **功能**: 播客脚本生成
- **参数**: `noteId`, `format`, `duration`
- **格式选项**: 独白、对话、访谈
- **时长选项**: 5 分钟、10 分钟、20 分钟
- **输出**: JSON 格式（标题、开场白、大纲、完整逐字稿、主持人 A/B 台词、结语、时长、标签）

### 2. 前端页面（3 个）

#### `app/dashboard/ai-studio/moments/page.tsx`
- **步骤流程**: 选择笔记 → 选择风格 → 生成文案
- **功能特性**:
  - 5 种风格选择（走心感悟、日常分享、鸡汤励志、幽默段子、知识干货）
  - 文案预览和编辑
  - 字数统计（50-150 字最佳）
  - 一键复制
  - 保存到数据库（ai_versions 表）

#### `app/dashboard/ai-studio/short-video/page.tsx`
- **步骤流程**: 选择平台 → 选择笔记 → 生成脚本
- **功能特性**:
  - 3 个平台选择（抖音、视频号、B 站）
  - 4 种类型选择（口播、vlog、教程、故事）
  - 多字段预览（标题、脚本、分镜、字幕、标签、BGM、封面）
  - 各字段独立复制
  - 保存到数据库（含 metadata）

#### `app/dashboard/ai-studio/podcast/page.tsx`
- **步骤流程**: 选择配置 → 选择笔记 → 生成脚本
- **功能特性**:
  - 3 种格式选择（独白、对话、访谈）
  - 3 种时长选择（5 分钟、10 分钟、20 分钟）
  - 多字段预览（标题、开场白、大纲、完整脚本、主持人 A/B 台词、结语）
  - 预计时长显示
  - 各字段独立复制
  - 保存到数据库（含 metadata）

### 3. 技术实现细节

#### AI 调用
使用统一的 `callAI` 函数（`lib/ai/unified-client.ts`）:
```typescript
import { callAI } from '@/lib/ai/unified-client'
const result = await callAI(prompt, { systemPrompt: '...' })
```

#### 数据库保存
保存到 Supabase `ai_versions` 表:
```typescript
await supabase.from('ai_versions').insert({
  note_id: selectedNote.id,
  platform: 'moments' | 'short-video' | 'podcast',
  version: nextVersion,
  content: generatedContent,
  user_id: user?.id,
  metadata: { ... },  // 存储平台特定元数据
})
```

#### UI 设计
- 使用共享组件：`NoteSelector`, `StepIndicator`
- 遵循现有 CSS 变量规范
- 三步流程指示器
- 加载状态遮罩层
- 响应式布局

## 与小红书页面的对比

| 特性 | 小红书 | 朋友圈 | 短视频 | 播客 |
|------|--------|--------|--------|------|
| 步骤数 | 6 步 | 3 步 | 3 步 | 3 步 |
| 风格选择 | ✅ | ✅ | ✅ (平台 + 类型) | ✅ (格式 + 时长) |
| 配图生成 | ✅ | ❌ | ❌ | ❌ |
| 多字段输出 | ✅ | ❌ | ✅ | ✅ |
| 缓存草稿 | ✅ | ❌ | ❌ | ❌ |
| 提示词翻译 | ✅ | ❌ | ❌ | ❌ |

## 后续优化建议

1. **朋友圈**: 可添加图片建议功能
2. **短视频**: 可添加 AI 生成封面图片功能
3. **播客**: 可集成 TTS 生成音频预览
4. **通用**: 添加草稿自动保存功能
5. **通用**: 添加历史记录查看功能

## 文件清单

### API 路由
- ✅ `app/api/ai-studio/moments/generate/route.ts`
- ✅ `app/api/ai-studio/short-video/generate/route.ts`
- ✅ `app/api/ai-studio/podcast/generate/route.ts`

### 前端页面
- ✅ `app/dashboard/ai-studio/moments/page.tsx`
- ✅ `app/dashboard/ai-studio/short-video/page.tsx`
- ✅ `app/dashboard/ai-studio/podcast/page.tsx`

## 测试建议

1. 分别测试三个平台的完整流程
2. 测试不同风格/平台/类型的生成效果
3. 测试保存功能（检查数据库记录）
4. 测试复制功能
5. 测试错误处理（网络错误、API 错误等）

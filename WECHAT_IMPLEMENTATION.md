# 公众号改写功能完善总结

## 已完成的工作

### 1. 新增 API 路由

#### `/api/ai-studio/wechat/generate/route.ts`
- **功能**: 公众号文案生成
- **输入**: 
  - `noteId`: 笔记 ID
  - `style`: 风格选择 (professional/warm/tech)
- **输出**:
  - `titles`: 3 个备选标题
  - `summary`: 文章摘要
  - `content`: 正文内容 (Markdown 格式)
  - `tags`: 标签数组
- **特点**:
  - 支持 3 种风格：专业深度、温暖治愈、科技感
  - 每种风格有独立的 system prompt 和 prompt template
  - 使用 unified-client 调用 AI
  - JSON 格式输出，便于前端解析

#### `/api/ai-studio/wechat/generate-cover/route.ts`
- **功能**: 公众号封面图生成
- **输入**:
  - `title`: 文章标题
  - `summary`: 文章摘要 (可选)
  - `style`: 风格 (professional/warm/tech)
- **输出**:
  - `imageUrl`: 生成的封面图 URL
- **特点**:
  - 使用通义万相 qwen-image-2.0-pro
  - 尺寸：900*383 像素 (公众号封面标准比例)
  - 支持重试机制 (处理 429 速率限制)
  - 根据风格生成不同的视觉描述

### 2. 完善前端页面

#### `app/dashboard/ai-studio/wechat/page.tsx`
完整实现了 5 步流程：

1. **步骤 0: 选择笔记**
   - 使用 NoteSelector 组件
   - 显示笔记预览

2. **步骤 1: 选择风格**
   - 使用 StyleSelector 组件
   - 3 种风格：专业深度、温暖治愈、科技感

3. **步骤 2: 生成文案**
   - 显示 3 个备选标题 (可点击选择)
   - 可编辑摘要
   - 可编辑正文内容
   - 显示标签
   - 支持重新生成

4. **步骤 3: 生成封面图**
   - 显示生成进度动画
   - 展示生成的封面图 (900x383px)
   - 支持重新生成

5. **步骤 4: 预览保存**
   - 保存到数据库 (ai_versions 表)
   - metadata 字段存储：标题、摘要、封面图、标签等
   - 保存成功后返回 AI Studio

### 3. 数据库保存

保存到 `ai_versions` 表，字段包括：
- `note_id`: 关联笔记 ID
- `platform`: 'wechat'
- `version`: 版本号 (自动递增)
- `content`: 正文内容
- `style`: 选择的风格
- `user_id`: 用户 ID
- `metadata`: JSONB 字段，存储：
  - `titles`: 所有备选标题
  - `selectedTitle`: 选中的标题
  - `summary`: 摘要
  - `tags`: 标签
  - `coverImage`: 封面图 URL

### 4. UI 设计

遵循已有设计规范：
- 使用 CSS 变量：`var(--bg-primary)`, `var(--accent)`, `var(--text-primary)` 等
- 使用 StepIndicator 组件显示步骤进度
- 卡片式布局，统一的圆角和间距
- 微信绿色主题色：#07C160
- 响应式设计，支持移动端

### 5. 参考 baoyu skill

参考了 baoyu 的公众号发布 skill 的设计理念：
- 风格化输出 (themes/colors)
- 结构化内容 (标题 + 摘要 + 正文)
- 封面图生成
- Markdown 转 HTML (前端可自行处理)

## 文件结构

```
app/
├── api/
│   └── ai-studio/
│       └── wechat/
│           ├── generate/
│           │   └── route.ts          # 文案生成 API
│           ├── generate-cover/
│           │   └── route.ts          # 封面图生成 API
│           └── generate-image/       # (已有，未修改)
└── dashboard/
    └── ai-studio/
        └── wechat/
            └── page.tsx              # 公众号改写页面

lib/
└── ai/
    └── unified-client.ts             # (已有，统一 AI 客户端)
```

## 使用流程

1. 用户进入公众号改写页面
2. 选择要改写的笔记
3. 选择文章风格 (专业深度/温暖治愈/科技感)
4. 点击"开始生成文案"
5. AI 生成 3 个标题、摘要、正文、标签
6. 用户可选择标题、编辑内容
7. 点击"生成封面图"
8. AI 生成 900x383 的封面图
9. 预览并保存
10. 保存到数据库，返回 AI Studio

## 技术特点

### AI 调用
- 使用 unified-client 统一接口
- 支持多 provider (qwen/claude)
- 当前默认使用 qwen3.5-plus

### 图片生成
- 通义万相 qwen-image-2.0-pro
- 标准公众号封面尺寸 900x383
- 自动重试机制处理速率限制

### 错误处理
- API 错误捕获和友好提示
- 降级处理 (JSON 解析失败时使用默认值)
- 加载状态显示

### 用户体验
- 步骤指示器清晰展示进度
- 可编辑所有内容
- 支持重新生成
- 加载状态和动画

## 后续优化建议

1. **Markdown 转 HTML**: 前端可集成 baoyu-markdown-to-html 的转换逻辑，实现预览
2. **公众号发布**: 集成 baoyu-post-to-wechat 的 API 或浏览器自动化发布
3. **历史记录**: 在 AI Studio 中展示所有改写历史
4. **更多风格**: 扩展风格选项 (如故事叙述、干货清单、观点评论等)
5. **配图生成**: 除了封面图，还可生成文章内配图
6. **字数控制**: 添加字数范围选择
7. **SEO 优化**: 生成 SEO 友好的标题和摘要

## 注意事项

1. **环境变量**: 确保配置了 `DASHSCOPE_API_KEY` 用于图片生成
2. **数据库表**: 确保 `ai_versions` 表存在且有 `metadata` JSONB 字段
3. **API 路径**: 所有 API 路径使用 `/api/ai-studio/wechat/` 前缀
4. **样式一致性**: 与 xiaohongshu 页面保持一致的设计语言

## 测试建议

1. 测试 3 种不同风格的文案生成
2. 测试封面图生成 (不同风格)
3. 测试保存功能 (检查数据库)
4. 测试错误处理 (网络错误、API 错误)
5. 测试移动端响应式布局

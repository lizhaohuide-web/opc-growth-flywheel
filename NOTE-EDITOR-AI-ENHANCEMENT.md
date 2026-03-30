# 笔记编辑 AI 增强功能开发文档

**开发日期**: 2026-03-30  
**版本**: v1.0  
**框架**: gstack 路径 A (渐进式优化)

---

## 🎯 产品定位

**笔记编辑 = 思考教练**

- **新手**: 解决"不知道写什么、写得杂乱"
- **进阶**: 解决"写得太浅"
- **通用**: 解决"写了易遗忘"
- **核心目标**: 提高成就感

---

## 📦 新增功能

### 1. AI 智能追问 (AIQuestioner)

**功能**: 在引导式模板填写过程中，AI 自动生成深度追问

**触发条件**:
- 用户答案长度 > 20 字
- 每个字段完成后延迟 1 秒触发
- 每 2-3 个字段追问一次（避免打扰）

**UI 位置**: GuidedNoteForm 每个字段下方

**技术实现**:
- 组件：`components/notes/AIQuestioner.tsx`
- API: `/api/notes/ai-question`
- 模型：qwen3.5-plus

---

### 2. 智能提示 (SmartHint)

**功能**: 自由书写模式下，检测到浅层内容时温和提醒

**触发条件**:
- 内容长度 < 50 字
- 包含泛化词汇（"很好"、"不错"、"学习了"）
- 缺少具体细节（数字、案例、地名等）

**UI 位置**: RichMarkdownEditor 下方

**用户控制**:
- 默认开启
- 可关闭（localStorage 持久化）
- 可单次忽略

**技术实现**:
- 组件：`components/notes/SmartHint.tsx`
- API: `/api/notes/smart-hint`
- 模型：qwen3.5-plus

---

### 3. 质量反馈 (QualityFeedback)

**功能**: 保存笔记后，AI 生成质量评分和改进建议

**评分维度**:
- 结构清晰度 (1-10 分)
- 观点深度 (1-10 分)
- 案例支撑 (1-10 分)

**UI 位置**: 编辑页面保存后显示

**展示时机**: 保存成功后（选项 C：用户主动查看）

**技术实现**:
- 组件：`components/notes/QualityFeedback.tsx`
- API: `/api/notes/[id]/quality-feedback`
- 模型：qwen3.5-plus

---

## 📁 文件结构

```
components/notes/
├── AIQuestioner.tsx          ✅ 新增
├── SmartHint.tsx             ✅ 新增
├── QualityFeedback.tsx       ✅ 新增
├── GuidedNoteForm.tsx        ✅ 修改（集成 AIQuestioner）
└── RichMarkdownEditor.tsx    ⏳ 待修改（集成 SmartHint）

app/api/notes/
├── ai-question/
│   └── route.ts              ✅ 新增
├── smart-hint/
│   └── route.ts              ✅ 新增
└── [id]/
    └── quality-feedback/
        └── route.ts          ✅ 新增

lib/ai/
└── qwen-client.ts            ✅ 新增（Qwen API 封装）

app/dashboard/notes/
└── [id]/
    └── edit/
        └── page.tsx          ✅ 修改（集成 QualityFeedback）
```

---

## 🔧 技术细节

### Qwen API 配置

```typescript
const QWEN_API_KEY = 'sk-sp-f18e0636b4c34b02a89167a2d5730758'
const QWEN_BASE_URL = 'https://coding.dashscope.aliyuncs.com/v1'
const QWEN_MODEL = 'qwen3.5-plus'
```

### Prompt 设计

**AI 追问 Prompt**:
```
你是一位专业的思考教练，帮助用户深度思考。
你的任务是根据用户的回答，提出 1-2 个有深度的追问。

追问原则：
1. 具体化：引导用户给出具体案例、细节、数据
2. 深度化：引导用户思考原因、影响、本质
3. 行动化：引导用户思考如何应用、下一步行动
4. 简洁：每个问题不超过 30 字
5. 温和：用启发式语气，不要像审问
```

**智能提示 Prompt**:
```
你是一位温和的写作助手。
检测到用户的内容有以下问题：[问题列表]
请用一句话温和地提醒用户，引导他写得更具体、更深入。

要求：
1. 语气友好，不要批评
2. 给出具体建议
3. 不超过 40 字
```

**质量反馈 Prompt**:
```
你是一位专业的笔记评审专家。
请从以下维度评估笔记质量：
1. 结构清晰度 (1-10 分)
2. 观点深度 (1-10 分)
3. 案例支撑 (1-10 分)

然后给出 2-3 条具体改进建议。
返回 JSON 格式。
```

---

## 🧪 测试清单

### 功能测试
- [ ] AIQuestioner 在 GuidedNoteForm 中正常显示
- [ ] SmartHint 开关功能正常（开启/关闭/忽略）
- [ ] QualityFeedback 保存后正常显示
- [ ] 所有 API 调用正常（无 500 错误）
- [ ] localStorage 持久化正常

### 兼容性测试
- [ ] 不影响现有自由书写模式
- [ ] 不影响现有引导式模板模式
- [ ] 移动端显示正常
- [ ] 暗色主题适配正常

### 性能测试
- [ ] AI 请求延迟 < 3 秒
- [ ] 不影响编辑流畅度
- [ ] 无内存泄漏

---

## 📊 成功指标

| 指标 | 基线 | 目标 | 测量方式 |
|------|------|------|---------|
| 模板完成率 | ? | +20% | 保存/打开比例 |
| 平均笔记长度 | ? | +30% | 字符数统计 |
| 智能提示采纳率 | N/A | >40% | 点击追踪 |
| AI 追问互动率 | N/A | >50% | 展开更多点击 |

---

## 🚀 下一步 (路径 B/C 预研)

### 路径 B：双模式融合
- 自由书写 + 智能引导无缝切换
- 检测用户写作状态，主动提供模板建议
- 周期：4-6 周

### 路径 C：对话式重构
- 用对话式 AI 替代部分模板
- 核心交互：对话 → 生成结构化笔记
- 周期：6-8 周

---

## 📝 维护说明

### API Key 管理
- 环境变量：`QWEN_API_KEY`
- 位置：`.env.local`
-  provider：阿里云百炼

### 调整追问频率
修改 `components/notes/AIQuestioner.tsx`:
```typescript
// 修改此值调整触发延迟（毫秒）
const timer = setTimeout(() => {
  fetchQuestion()
}, 1000) // 改为 2000 则延迟 2 秒
```

### 调整检测规则
修改 `lib/ai/qwen-client.ts` 中的 `generateSmartHint` 函数:
```typescript
// 修改字数阈值
if (content.length < 50) { // 改为 30 或 100
  issues.push('内容较短')
}
```

---

**维护者**: OPC 增长飞轮产品团队  
**最后更新**: 2026-03-30

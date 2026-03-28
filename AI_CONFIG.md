# AI API 配置指南

## 🔑 获取 YibuAPI Key

### 方式 1：使用现有配置（推荐）
项目已配置 YibuAPI，直接使用：

```env
AI_API_KEY=sk-hwj0xZqpUJnrTXQlY2AI34bSUGRn49EsO7pGRlBPQGa5f3cv
```

### 方式 2：注册自己的 YibuAPI 账号

1. **访问** https://yibuapi.com
2. **注册账号**
3. **充值余额**（首次使用建议充值 10 元测试）
4. **创建 API Key**
   - 进入控制台 → API Keys
   - 点击"创建新密钥"
   - 复制密钥

5. **更新 .env.local**：
   ```env
   AI_API_KEY=你的 API Key
   ```

---

## 🚀 测试 AI 连接

### 方法 1：浏览器控制台测试

1. 打开任意笔记详情页
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签
4. 点击"智能摘要"按钮
5. 查看日志：
   ```
   🤖 AI 请求：{ baseUrl: "...", model: "...", promptLength: XXX }
   📡 AI 响应状态：200
   ✅ AI 成功响应：...
   ```

### 方法 2：使用测试页面

访问：`http://localhost:3000/api/test-ai`（需要创建测试页面）

---

## ⚠️ 常见错误

### 1. "AI_API_KEY 未配置"
**原因**：`.env.local` 文件不存在或没有 `AI_API_KEY`

**解决**：
```bash
# 复制示例文件
cp .env.example .env.local

# 编辑 .env.local，填入你的 API Key
```

### 2. "API Key 无效或已过期"
**原因**：API Key 错误或已失效

**解决**：
- 检查 `.env.local` 中的 API Key 是否正确
- 登录 YibuAPI 控制台检查密钥状态
- 重新创建新的 API Key

### 3. "API 请求超限"
**原因**：账户余额不足或请求频率过高

**解决**：
- 登录 YibuAPI 控制台检查余额
- 充值账户
- 降低请求频率

### 4. "AI 服务内部错误"
**原因**：YibuAPI 服务器问题

**解决**：
- 等待几分钟后重试
- 检查 YibuAPI 状态页面
- 联系 YibuAPI 支持

---

## 🔧 高级配置

### 使用其他 AI 提供商

**使用 OpenAI**：
```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your-openai-key
AI_MODEL=gpt-4o
```

**使用阿里云百炼**：
```env
AI_BASE_URL=https://dashscope.aliyuncs.com/api/v1
AI_API_KEY=sk-your-dashscope-key
AI_MODEL=qwen-max
```

**使用月之暗面**：
```env
AI_BASE_URL=https://api.moonshot.cn/v1
AI_API_KEY=sk-your-moonshot-key
AI_MODEL=moonshot-v1-8k
```

---

## 📊 费用说明

**YibuAPI 定价**（参考）：
- Qwen3.5-Plus：约 ¥0.01/1000 tokens
- 生成一篇摘要（500 字）：约 ¥0.05
- 生成一篇公众号文章（2000 字）：约 ¥0.2

**建议**：
- 开发测试：充值 10 元可用很久
- 生产环境：根据用户量充值

---

## 🆘 获取帮助

1. **查看控制台日志** - 最准确的错误信息
2. **检查 .env.local 配置** - 确保格式正确
3. **重启开发服务器** - `Ctrl+C` 然后 `npm run dev`
4. **联系 YibuAPI 支持** - https://yibuapi.com/support

---

**配置完成后，刷新页面并测试智能摘要功能！** 🚀

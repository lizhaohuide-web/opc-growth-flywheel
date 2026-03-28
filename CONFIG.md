# OPC 增长飞轮 - 配置指南

## 🔑 第一步：获取 Supabase 配置

1. **访问** https://supabase.com 并登录
2. **创建新项目** → 选择靠近你的区域（推荐 Asia）
3. **等待项目初始化**（约 2 分钟）
4. **获取配置**：
   - 进入 Settings → API
   - 复制 `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - 复制 `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🤖 第二步：获取 AI API 密钥

**使用 YibuAPI**（推荐）：
1. 访问 https://yibuapi.com
2. 注册账号并充值
3. 进入 API Keys 页面创建密钥
4. 复制密钥到 `AI_API_KEY`

**或使用其他 API**：
- OpenAI: https://platform.openai.com/api-keys
- Qwen: https://dashscope.console.aliyun.com/

## 📝 第三步：更新环境变量

编辑 `.env.local` 文件：

```env
# Supabase 配置（替换为你的真实值）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key

# AI API 配置
AI_API_KEY=sk-your-api-key

# 应用配置
NEXT_PUBLIC_APP_NAME=OPC 增长飞轮
```

## 🗄️ 第四步：初始化数据库

在 **Supabase Dashboard** → **SQL Editor** 执行：

```sql
-- 复制粘贴 supabase/migrations/001_init_schema.sql 的全部内容
-- 点击 Run 执行
```

**验证表创建成功**：
- 进入 Table Editor
- 应该看到 `profiles` 和 `notes` 两张表

## 🚀 第五步：启动本地开发

```bash
cd /Users/lizhaohui/.openclaw/workspace/projects/opc-growth-flywheel
npm run dev
```

访问 http://localhost:3000

## ✅ 验证清单

- [ ] 首页正常加载
- [ ] 可以注册新账号
- [ ] 可以登录
- [ ] 登录后跳转到仪表盘
- [ ] 可以创建笔记
- [ ] 可以看到笔记列表
- [ ] AI 功能正常（生成摘要/文章）

## 🌐 第六步：部署到 Vercel（可选）

1. **安装 Vercel CLI**：
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**：
   ```bash
   vercel login
   ```

3. **部署**：
   ```bash
   vercel
   ```

4. **配置环境变量**（Vercel Dashboard）：
   - 添加 `NEXT_PUBLIC_SUPABASE_URL`
   - 添加 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 添加 `AI_API_KEY`

5. **重新部署**：
   ```bash
   vercel --prod
   ```

---

## 🆘 常见问题

**Q: 注册后收不到验证邮件？**
A: 检查垃圾邮件箱，或在 Supabase Dashboard → Authentication → Emails 关闭邮件确认

**Q: AI 生成失败？**
A: 检查 AI_API_KEY 是否正确，账户是否有余额

**Q: 本地启动失败？**
A: 运行 `npm install` 重新安装依赖

**Q: 数据库权限错误？**
A: 确认 RLS 策略已正确创建，检查 SQL 是否完整执行

---

**配置完成后，访问 http://localhost:3000 开始使用！** 🎉

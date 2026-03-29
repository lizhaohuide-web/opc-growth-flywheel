# 多设备登录修复指南

## 🔍 问题诊断

**当前问题**: 一个账号只能登录一台设备，新登录会踢掉旧设备  
**根本原因**: Supabase Auth 默认使用 **单会话模式**（Single Session）

---

## ✅ 解决方案

### 方案 1: Supabase Dashboard 配置（推荐，5 分钟搞定）

这是最简单的方式，无需修改代码。

#### 步骤 1: 登录 Supabase Dashboard
访问：https://supabase.com/dashboard

#### 步骤 2: 进入认证设置
```
你的项目 → Authentication → Providers → Email
```

#### 步骤 3: 关闭"单会话"限制
1. 找到 **"Secure token flow"** 或 **"Session management"** 部分
2. 关闭 **"Single session per user"** 选项
3. 或者设置 **"Max sessions per user"** 为你想要的数量（例如：3 或 5）
4. 点击 **Save**

#### 步骤 4: 验证配置
```sql
-- 在 SQL Editor 中运行，查看当前配置
SELECT config FROM auth.config;
```

---

### 方案 2: 使用 Supabase API 配置（自动化）

如果需要通过代码配置：

```bash
# 使用 Supabase CLI
supabase auth config set --max-sessions-per-user 5
```

或者通过 Management API：

```bash
curl -X PATCH 'https://your-project.supabase.co/auth/v1/config' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "max_sessions_per_user": 5
  }'
```

---

### 方案 3: 自定义会话管理（高级，不推荐）

如果 Supabase 不支持你的需求，可以自己实现会话管理：

1. 创建 `user_sessions` 表追踪活跃会话
2. 每次登录时检查会话数量
3. 超过限制时拒绝新登录或踢掉最旧的会话

**SQL Schema:**
```sql
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info TEXT,
  ip_address TEXT,
  session_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 索引优化
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
```

---

## 🔧 代码优化（可选）

### 1. 显示当前登录设备

在 Dashboard 中添加"设备管理"页面：

```tsx
// app/dashboard/settings/devices/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DevicesPage() {
  const [sessions, setSessions] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function loadSessions() {
      const { data } = await supabase.auth.mfa.listFactors()
      // 或者调用自定义 API 获取会话列表
      setSessions(data || [])
    }
    loadSessions()
  }, [])

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">已登录设备</h2>
      <ul className="space-y-3">
        {sessions.map((session: any) => (
          <li key={session.id} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <div>
              <p className="font-medium">设备名称</p>
              <p className="text-xs text-muted">最后登录：{new Date(session.last_active_at).toLocaleString()}</p>
            </div>
            <button className="btn-ghost text-xs">退出</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 2. 添加设备标识

在登录时记录设备信息：

```tsx
// app/auth/login/page.tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // 获取设备信息
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (!error && data.user) {
    // 记录会话到自定义表（可选）
    await fetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        userId: data.user.id,
        sessionToken: data.session?.access_token,
        ...deviceInfo
      })
    })
    
    router.push('/dashboard')
  }
}
```

---

## 📊 推荐配置

| 用户类型 | 最大会话数 | 会话过期时间 |
|---------|-----------|-------------|
| 免费用户 | 3 台设备 | 7 天 |
| 付费用户 | 10 台设备 | 30 天 |
| 企业用户 | 无限 | 90 天 |

---

## 🧪 测试步骤

### 1. 配置完成后测试

**测试 1: 多浏览器登录**
```
1. Chrome 登录账号
2. Safari 登录同一账号
3. Firefox 登录同一账号
4. 验证三个浏览器都能正常访问
```

**测试 2: 跨设备登录**
```
1. 手机浏览器登录
2. 电脑浏览器登录
3. 平板浏览器登录
4. 验证所有设备都能正常使用
```

**测试 3: 超出限制测试**
```
1. 设置最大会话数为 3
2. 在第 4 台设备登录
3. 验证：
   - 新登录被拒绝，或
   - 最旧的设备被踢出
```

---

## 🔍 故障排查

### 问题 1: 配置后仍然只能单设备登录

**检查清单:**
- [ ] 确认 Supabase Dashboard 配置已保存
- [ ] 清除浏览器缓存和 Cookie
- [ ] 重启 Next.js 开发服务器
- [ ] 检查是否有自定义的会话验证逻辑

### 问题 2: 会话不生效

**检查:**
```bash
# 查看 Supabase 项目配置
curl -X GET 'https://your-project.supabase.co/auth/v1/config' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

### 问题 3: Cookie 问题

确保 `next.config.js` 中的 Cookie 配置正确：

```javascript
// next.config.js
module.exports = {
  // ...其他配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      }
    ]
  }
}
```

---

## 📚 参考资料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth Config API](https://supabase.com/docs/reference/javascript/auth-config)
- [Next.js + Supabase SSR](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

## ✅ 快速检查清单

- [ ] 登录 Supabase Dashboard
- [ ] 进入 Authentication → Providers → Email
- [ ] 关闭 "Single session per user" 或设置 "Max sessions per user"
- [ ] 保存配置
- [ ] 测试多设备登录
- [ ] （可选）添加设备管理页面
- [ ] （可选）记录设备信息用于安全审计

---

**创建日期**: 2026-03-29  
**预计修复时间**: 5-10 分钟  
**难度**: ⭐☆☆☆☆（简单）

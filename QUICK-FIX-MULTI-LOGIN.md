# ⚡ 5 分钟修复多设备登录问题

## 🎯 问题
一个账号只能登录一台设备，新登录会踢掉旧设备

## ✅ 解决方案（5 分钟搞定）

### 第 1 步：打开 Supabase Dashboard（30 秒）

访问：https://supabase.com/dashboard

找到你的项目 `opc-growth-flywheel`（或对应的项目名称）

---

### 第 2 步：进入认证设置（1 分钟）

在左侧菜单依次点击：
```
Authentication → Providers → Email
```

---

### 第 3 步：修改会话配置（2 分钟）

**找到以下选项并修改：**

#### 选项 A：关闭单会话限制
找到 **"Single session per user"** 或 **"Allow multiple sessions"**
- ❌ 关闭 "Single session per user"
- ✅ 开启 "Allow multiple sessions"

#### 选项 B：设置最大会话数（如果有这个选项）
找到 **"Max sessions per user"**
- 设置为：`5`（或你想要的数量）

#### 选项 C：会话过期时间
找到 **"Session expiry"** 或 **"Token expiry"**
- 设置为：`604800`（7 天，单位：秒）
- 或者：`2592000`（30 天）

---

### 第 4 步：保存配置（30 秒）

点击页面底部的 **"Save"** 或 **"Update"** 按钮

---

### 第 5 步：测试验证（2 分钟）

**测试步骤：**
1. 打开手机浏览器 → 登录账号
2. 打开电脑浏览器 → 登录同一账号
3. 验证两个浏览器都能正常访问 Dashboard

**预期结果：**
✅ 手机和电脑可以同时登录
✅ 两个设备的数据同步正常
✅ 不会互相踢下线

---

## 🔍 如果找不到上述选项

Supabase 的界面可能会更新，如果找不到上述选项：

### 方法 1：使用 SQL Editor

在 Supabase Dashboard 中：
```
SQL Editor → New Query
```

运行以下 SQL：
```sql
-- 查看当前认证配置
SELECT * FROM auth.config;

-- 更新最大会话数（如果支持）
UPDATE auth.config 
SET config = config || '{"max_sessions_per_user": 5}'::jsonb;
```

### 方法 2：使用 Supabase CLI

如果你安装了 Supabase CLI：

```bash
# 安装 CLI（如果还没装）
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref 你的项目 ID

# 查看当前配置
supabase auth config get

# 更新配置
supabase auth config set --max-sessions-per-user 5
```

### 方法 3：联系 Supabase 支持

如果以上方法都不行，可能是你的 Supabase 版本不支持多会话。

访问：https://supabase.com/support

或者在 Dashboard 中提交工单。

---

## 📋 配置后的预期效果

| 场景 | 修复前 | 修复后 |
|------|-------|-------|
| 手机登录 | ✅ 可以 | ✅ 可以 |
| 电脑登录 | ❌ 被踢 | ✅ 可以 |
| 平板登录 | ❌ 被踢 | ✅ 可以 |
| 最大设备数 | 1 台 | 5 台（可配置） |
| 会话过期 | 立即 | 7 天（可配置） |

---

## 🎁 额外优化建议

### 1. 添加"退出其他设备"功能

在 Dashboard 设置页面添加一个按钮：

```tsx
<button 
  onClick={async () => {
    await fetch('/api/auth/logout-others', { method: 'POST' })
    alert('已退出其他所有设备')
  }}
  className="btn-ghost"
>
  退出其他设备
</button>
```

### 2. 显示当前登录设备

在设置页面显示：
- 当前设备：Chrome on macOS ✅
- 其他设备：Safari on iPhone（30 分钟前）
- 其他设备：Firefox on Windows（2 小时前）

每个设备后面加一个"退出"按钮。

### 3. 安全提醒

当检测到新设备登录时：
- 发送邮件通知
- 显示登录时间和地点
- 提供"这不是我"的快速举报按钮

---

## ❓ 常见问题

### Q: 免费版支持多会话吗？
A: 支持！Supabase 免费版也支持多会话配置。

### Q: 最多可以设置多少台设备？
A: 技术上没有上限，但建议：
- 免费用户：3-5 台
- 付费用户：10-20 台
- 企业用户：根据需要

### Q: 会话多久过期？
A: 默认 7 天，可以设置为：
- 最短：1 小时（3600 秒）
- 最长：90 天（7776000 秒）

### Q: 会影响现有用户吗？
A: 不会，配置立即生效，现有用户的会话不受影响。

---

**预计耗时**: 5 分钟  
**难度**: ⭐☆☆☆☆  
**影响范围**: 所有用户

---

## 📞 需要帮助？

如果配置过程中遇到问题：

1. 截图当前页面
2. 记录具体错误信息
3. 联系 Supabase 支持或项目维护者

**快速反馈模板：**
```
问题：多设备登录配置
Supabase 项目 ID: [你的项目 ID]
当前页面截图：[粘贴截图]
错误信息：[粘贴错误]
```

---

**创建时间**: 2026-03-29 12:20  
**最后更新**: 2026-03-29 12:20

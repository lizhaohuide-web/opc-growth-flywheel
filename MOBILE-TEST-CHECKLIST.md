# 移动端测试清单

## ✅ 已修复的核心问题

### 1. Viewport Meta Tag
**问题**: 缺少 viewport 配置，导致手机端无法自适应缩放  
**修复**: 在 `app/layout.tsx` 中添加：
```typescript
viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
```

### 2. 响应式字体大小
**问题**: 标题和正文在手机上字体过大，溢出屏幕  
**修复**: 使用响应式字体类：
- `text-3xl sm:text-5xl md:text-7xl` - 标题
- `text-sm sm:text-base` - 正文

### 3. 网格布局
**问题**: 三列布局在手机上挤压变形  
**修复**: 改为移动端单列，平板以上三列：
```tsx
className="grid grid-cols-1 md:grid-cols-3 gap-6"
```

### 4. 触摸优化
**问题**: 触摸点击区域太小，不易操作  
**修复**: 在 `globals.css` 中添加：
```css
@media (max-width: 768px) {
  button, a {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## 📱 测试步骤

### 方式 1: Chrome DevTools 模拟

1. 打开浏览器访问：http://localhost:3000
2. 按 `F12` 打开 DevTools
3. 按 `Ctrl+Shift+M` 切换设备工具栏
4. 选择以下设备测试：

**手机设备：**
- iPhone 12 Pro (390x844)
- iPhone 14 Plus (428x926)
- Pixel 5 (393x851)

**平板设备：**
- iPad Air (820x1180)
- iPad Pro (1024x1366)

### 方式 2: 真机测试

1. 确保手机和电脑在同一 WiFi 网络
2. 查看电脑 IP 地址（例如：`192.168.1.100`）
3. 手机浏览器访问：`http://192.168.1.100:3000`

**获取电脑 IP：**
```bash
# macOS
ipconfig getifaddr en0

# 或
ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

## ✅ 测试检查项

### 首页 (Home)
- [ ] Hero 标题完整显示，不溢出
- [ ] "免费注册" 和 "登录" 按钮在手机上垂直排列
- [ ] 按钮易于点击（≥44px）
- [ ] 核心功能卡片在手机上单列显示
- [ ] 文字大小适中，无需缩放即可阅读
- [ ] 页面无横向滚动条

### 登录/注册页
- [ ] 表单输入框字体 ≥16px（防止 iOS 自动放大）
- [ ] 输入框获得焦点时清晰可见
- [ ] 键盘弹出不遮挡输入框
- [ ] 提交按钮易于点击

### Dashboard 页面
- [ ] 侧边栏导航在移动端正常显示
- [ ] 笔记列表在手机上单列显示
- [ ] 编辑器工具栏适配小屏幕
- [ ] 弹窗和菜单在移动端正常显示

---

## 🐛 常见问题排查

### 问题 1: 页面仍然无法缩放
**检查**:
```bash
# 确认 layout.tsx 已包含 viewport
cat app/layout.tsx | grep viewport
```

**预期输出**:
```typescript
viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
```

### 问题 2: 文字在手机上太小
**解决**: 添加响应式字体类
```tsx
<p className="text-sm md:text-base">
```

### 问题 3: 图片溢出
**解决**: 添加图片响应式类
```tsx
<img src="..." className="max-w-full h-auto" />
```

### 问题 4: 布局错乱
**检查**: 是否使用了正确的响应式前缀
```tsx
// ✅ 正确
<div className="grid grid-cols-1 md:grid-cols-3">

// ❌ 错误
<div className="grid md:grid-cols-3 grid-cols-1">
```

---

## 🚀 部署后测试

### 1. 访问生产环境
```
https://www.opcmark.store/
```

### 2. 使用真实设备测试
- iPhone Safari
- Android Chrome
- iPad Safari

### 3. 性能测试
使用 Google PageSpeed Insights:
```
https://pagespeed.web.dev/
```

输入网址：`https://www.opcmark.store/`

---

## 📊 性能优化建议

### 图片优化
```tsx
// 使用 Next.js Image 组件
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  className="w-full h-auto"
  priority
/>
```

### 字体优化
```tsx
// 使用 display: 'swap' 防止 FOIT
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap', // 关键配置
})
```

### 代码分割
```tsx
// 动态导入大组件
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false,
  loading: () => <p>加载中...</p>
})
```

---

**测试完成日期**: 2026-03-29  
**测试人员**: ___________  
**问题记录**: ___________

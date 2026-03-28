# OPC 增长飞轮 - 快速启动指南

## 🚀 快速启动（推荐）

### 方式 1：双击启动（最简单）

**macOS**：
1. 打开 Finder
2. 进入文件夹：`/Users/lizhaohui/.openclaw/workspace/projects/opc-growth-flywheel/`
3. 双击 `start.command` 文件
4. 等待显示 "Ready" 后，浏览器自动打开

**Windows**（如果适用）：
1. 双击 `start.bat` 文件

### 方式 2：终端启动

```bash
# 打开终端，执行：
cd /Users/lizhaohui/.openclaw/workspace/projects/opc-growth-flywheel
npm run dev
```

### 方式 3：Spotlight 快速启动（macOS）

1. 按 `Cmd + Space` 打开 Spotlight
2. 输入 `Terminal`
3. 粘贴以下命令：
   ```bash
   cd /Users/lizhaohui/.openclaw/workspace/projects/opc-growth-flywheel && npm run dev
   ```

---

## 🌐 访问地址

启动后，在浏览器访问：

- **本地访问**：http://localhost:3000
- **局域网访问**：http://你的 IP:3000（需要配置）

---

## ⚡ 创建桌面快捷方式（推荐）

### macOS 方法：

1. **打开 Automator**（自动操作）
2. **新建文档** → 选择"应用程序"
3. **添加操作**：搜索"运行 Shell 脚本"
4. **输入脚本**：
   ```bash
   cd /Users/lizhaohui/.openclaw/workspace/projects/opc-growth-flywheel && npm run dev
   ```
5. **保存**为 "OPC 增长飞轮" 到应用程序文件夹
6. **拖到程序坞**，一键启动！

---

## 🔧 常见问题

### Q: 端口被占用？
**A**: 修改端口启动：
```bash
PORT=3001 npm run dev
```
然后访问 http://localhost:3001

### Q: 找不到 node_modules？
**A**: 重新安装依赖：
```bash
npm install
```

### Q: 如何停止服务器？
**A**: 在终端按 `Ctrl + C`

### Q: 开机自动启动？
**A**: 使用 macOS 自动操作创建启动器，然后添加到"系统偏好设置 → 用户与群组 → 登录项"

---

## 📱 手机访问（同一 WiFi）

1. 查看电脑 IP 地址：
   ```bash
   ifconfig | grep "inet "
   ```
2. 手机浏览器访问：`http://电脑 IP:3000`
3. 例如：`http://192.168.1.100:3000`

---

## 📞 技术支持

遇到问题？检查以下：
- [ ] Node.js 已安装（`node -v` 应该显示版本）
- [ ] 依赖已安装（`node_modules` 文件夹存在）
- [ ] 环境变量已配置（`.env.local` 文件存在）
- [ ] 端口未被占用

---

**快速访问**：http://localhost:3000 🚀

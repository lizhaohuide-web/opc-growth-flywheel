# OPC 增长飞轮

> **把思考变成收入** - One Person Company 的增长引擎

## 🎯 产品定位

OPC 增长飞轮是一款面向职场人和创作者的个人成长系统，帮助用户将每日思考转化为多平台内容，追踪成长轨迹，最终实现个人影响力与收入的双重增长。

## ✨ 核心功能

### 📝 今日笔记
- **自由书写**: Markdown 编辑器，实时预览
- **引导反思**: KPT/CORNELL/ORID 等专业模板
- **AI 访谈**: 对话式笔记生成

### 🔄 内容变形器
- **公众号文章**: 1500-2000 字深度文章
- **小红书图文**: 300-500 字种草文案
- **视频号脚本**: 30-60 秒分镜脚本
- **一键导出**: Markdown/PDF 格式

### 📊 成长分析
- **仪表盘**: 实时统计数据
- **周报生成**: AI 智能摘要
- **成长雷达图**: 8 维度分析
- **成就徽章**: 里程碑追踪

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/yourname/opc-growth-flywheel

# 安装依赖
cd opc-growth-flywheel
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的配置

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 部署上线

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + TailwindCSS
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Qwen3.5-plus (通过 YibuAPI)
- **图表**: Recharts
- **部署**: Vercel

## 📁 项目结构

```
opc-growth-flywheel/
├── app/              # Next.js App Router
├── components/       # React 组件
├── lib/              # 工具库
├── supabase/         # 数据库配置
└── .env.local        # 环境变量
```

## 🎯 功能清单

- [x] 用户认证（注册/登录/登出）
- [x] 笔记 CRUD（创建/读取/更新/删除）
- [x] Markdown 编辑器
- [x] 标签系统
- [x] 引导式问题模板
- [x] AI 内容生成（公众号/小红书）
- [x] 数据分析（仪表盘/周报）
- [x] 成长追踪（雷达图/徽章）
- [ ] 语音输入（计划中）
- [ ] 移动端 App（计划中）

## 📊 开发进度

| Phase | 功能 | 状态 |
|-------|------|------|
| Phase 1 | 项目初始化 | ✅ 完成 |
| Phase 2 | 用户认证 | ✅ 完成 |
| Phase 3 | 笔记核心功能 | ✅ 完成 |
| Phase 4 | 基础分析面板 | ✅ 完成 |
| Phase 5 | AI 内容生成 | ✅ 完成 |
| Phase 6 | 成长分析增强 | ✅ 完成 |
| Phase 7 | 部署与优化 | 🚧 进行中 |

**MVP 完成度**: 95%

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**构建于**: 2026-03-27  
**版本**: v1.0.0 MVP  
**Slogan**: 把思考变成收入

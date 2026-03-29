# 笔记编辑器升级指南

## 🎉 新增功能

### 1. 富文本工具栏
- ✅ **快捷格式化按钮**：加粗、斜体、标题、列表、引用、代码块等
- ✅ **一键插入**：链接、图片、表格、水平线
- ✅ **快捷键支持**：
  - `Cmd/Ctrl + B` - 加粗
  - `Cmd/Ctrl + I` - 斜体
  - `Cmd/Ctrl + K` - 插入链接
  - `Cmd/Ctrl + E` - 插入代码块
  - `Tab` - 缩进列表

### 2. 图片上传
- ✅ **拖拽上传**：直接拖拽图片到编辑器
- ✅ **粘贴上传**：截图后 `Cmd/Ctrl + V` 粘贴
- ✅ **按钮上传**：点击工具栏图片按钮选择文件
- ✅ **进度显示**：上传中显示状态提示
- ✅ **自动插入**：上传成功后自动插入 Markdown 语法

### 3. 实时预览
- ✅ **所见即所得**：编辑和预览同屏显示
- ✅ **语法高亮**：代码块自动高亮
- ✅ **表格渲染**：支持 Markdown 表格

### 4. 字数统计
- ✅ **实时统计**：字符数、单词数、行数
- ✅ **底部状态栏**：显示当前编辑状态

### 5. 响应式设计
- ✅ **移动端适配**：手机、平板、桌面完美适配
- ✅ **暗色主题**：自动跟随系统主题

---

## 📦 安装的依赖

```json
{
  "@uiw/react-md-editor": "^4.0.0",
  "react-dropzone": "^14.0.0"
}
```

---

## 🚀 使用指南

### 基础使用

1. **打开笔记页面**
   - 新建笔记：`/dashboard/notes/new`
   - 编辑笔记：`/dashboard/notes/[id]/edit`

2. **使用工具栏**
   ```
   [B] [I] [H1] [H2] [列表] [引用] [代码] [链接] [图片] [表格]
   ```

3. **快捷键**
   - `Cmd+B` - 加粗选中文本
   - `Cmd+I` - 斜体选中文本
   - `Cmd+K` - 为选中文本添加链接
   - `Cmd+E` - 插入代码块
   - `Tab` - 在列表中缩进
   - `Shift+Tab` - 在列表中取消缩进

### 图片上传

**方法 1：拖拽上传**
```
1. 打开文件管理器
2. 选择图片文件
3. 拖拽到编辑器区域
4. 松开鼠标，自动上传并插入
```

**方法 2：粘贴上传**
```
1. 截图（Cmd+Shift+4 或 Win+Shift+S）
2. 在编辑器中按 Cmd+V / Ctrl+V
3. 自动上传并插入
```

**方法 3：按钮上传**
```
1. 点击工具栏的图片图标 📷
2. 选择图片文件
3. 等待上传完成
4. 自动插入到光标位置
```

### Markdown 语法速查

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体文本**
*斜体文本*
~~删除线~~

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

> 引用文本

[链接文字](https://example.com)

![图片描述](图片 URL)

`行内代码`

```javascript
// 代码块
function hello() {
  console.log('Hello World')
}
```

| 表头 1 | 表头 2 |
|--------|--------|
| 单元格 1 | 单元格 2 |
```

---

## ⚙️ Supabase 配置

### 1. 运行迁移脚本

在 Supabase Dashboard 中：
```
SQL Editor → New Query
```

复制并运行 `supabase/migrations/002_add_image_storage.sql` 的内容：

```sql
-- 创建笔记图片存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储策略...
```

### 2. 验证存储桶

访问：`https://your-project.supabase.co/project/storage/buckets`

确认 `note-images` 存储桶已创建，并且：
- ✅ Public: Yes
- ✅ File size limit: 5MB（建议）

---

## 🎨 界面预览

### 编辑器工具栏
```
┌────────────────────────────────────────────────────┐
│ [B][I][U][H1][H2][列表][引用][代码][链接][图片]    │
├────────────────────────────────────────────────────┤
│ 开始记录你的思考...                                │
│                                                    │
│ # 我的笔记                                         │
│                                                    │
│ 这是**粗体**文本                                   │
│                                                    │
└────────────────────────────────────────────────────┘
📝 1234 字符  📄 45 行  📖 234 词        Markdown
```

### 拖拽上传提示
```
┌────────────────────────────────────────────────────┐
│                                                    │
│              📷                                     │
│           松开以上传图片                            │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 上传进度
```
┌────────────────────────────────────────────────────┐
│ [B][I][H1]...                        📤 上传中...  │
├────────────────────────────────────────────────────┤
│ # 我的笔记                                         │
│ ![image.png](https://...)                          │
└────────────────────────────────────────────────────┘
```

---

## 📊 文件结构

```
app/
├── api/
│   └── upload/
│       └── route.ts              # 图片上传 API
├── dashboard/
│   └── notes/
│       ├── new/
│       │   └── page.tsx          # 新建笔记页面（已更新）
│       └── [id]/
│           └── edit/
│               └── page.tsx      # 编辑笔记页面（已更新）
components/
└── notes/
    ├── RichMarkdownEditor.tsx    # 新增：富文本编辑器
    ├── MarkdownEditor.tsx        # 原有：简单编辑器（保留）
    ├── TagInput.tsx
    └── GuidedNoteForm.tsx
supabase/
└── migrations/
    └── 002_add_image_storage.sql # 新增：图片存储配置
```

---

## 🔧 自定义配置

### 修改编辑器高度

```tsx
<RichMarkdownEditor 
  value={content}
  onChange={setContent}
  height={600}  // 修改这里（默认 500）
/>
```

### 禁用图片上传

```tsx
<RichMarkdownEditor 
  value={content}
  onChange={setContent}
  onImageUpload={undefined}  // 不传这个参数
/>
```

### 自定义占位符

```tsx
<RichMarkdownEditor 
  value={content}
  onChange={setContent}
  placeholder="在这里记录你的想法..."
/>
```

---

## 🐛 常见问题

### Q1: 图片上传失败
**检查清单：**
- [ ] Supabase Storage 的 `note-images` 存储桶已创建
- [ ] 存储策略已正确配置
- [ ] 用户已登录
- [ ] 图片大小不超过 5MB

### Q2: 拖拽没反应
**解决方案：**
- 确保在编辑器区域内拖拽
- 检查浏览器是否支持 File API
- 尝试使用按钮上传

### Q3: 粘贴图片不生效
**解决方案：**
- 确保是图片格式（PNG、JPG 等）
- 某些浏览器需要权限，检查浏览器设置
- 使用拖拽或按钮上传作为备选

### Q4: 编辑器样式异常
**解决方案：**
```bash
# 清除缓存
rm -rf .next
npm run dev
```

---

## 📈 后续优化建议

### 短期（1-2 周）
- [ ] 添加笔记模板功能
- [ ] 支持 PDF 导出
- [ ] 添加笔记搜索功能
- [ ] 支持笔记版本历史

### 中期（1 个月）
- [ ] 协同编辑（多人同时编辑）
- [ ] 笔记分享功能
- [ ] 移动端优化（触摸手势）
- [ ] 离线编辑支持

### 长期（3 个月+）
- [ ] AI 辅助写作
- [ ] 智能标签推荐
- [ ] 笔记关联图谱
- [ ] 语音输入支持

---

## 📚 参考资料

- [@uiw/react-md-editor 文档](https://uiwjs.github.io/react-md-editor/)
- [react-dropzone 文档](https://react-dropzone.js.org/)
- [Markdown 语法指南](https://commonmark.org/help/)
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)

---

**升级日期**: 2026-03-29  
**版本**: v2.0  
**维护者**: OPC 增长飞轮团队

import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'
import { callNovaAIClaude } from '@/lib/ai/client-novai'
import { createClient } from '@/lib/supabase/server'

/**
 * 小红书图片提示词生成 API - 完整复刻 baoyu-xhs-images skill 流程
 * 
 * 三步流程：
 * 1. 深度分析文案 → analysis.md
 * 2. 生成 3 种大纲策略 → outline-strategy-a/b/c.md
 * 3. 选择最优大纲并生成提示词 → prompts/
 */

// ============================================
// 10 种风格预设（来自 baoyu skill references/presets/）
// ============================================
const stylePresets: Record<string, {
  name: string
  category: string
  colorPalette: {
    primary: string[]
    background: string[]
    accents: string[]
  }
  visualElements: string[]
  typography: string
  elementCombination: {
    canvas: { ratio: string; grid: string[] }
    image_effects: { cutout: string; stroke: string[]; filter: string[] }
    typography: { decorated: string[]; tags: string[]; direction: string[] }
    decorations: { emphasis: string[]; background: string[]; doodles: string[]; frames: string[] }
  }
  bestLayouts: Record<string, '✓✓' | '✓' | '✗'>
  bestFor: string[]
  doAndDont?: { do: string[]; dont: string[] }
}> = {
  cute: {
    name: '可爱甜美风',
    category: 'sweet',
    colorPalette: {
      primary: ['粉色 #FED7E2', '蜜桃色 #FEEBC8', '薄荷绿 #C6F6D5', '薰衣草紫 #E9D8FD'],
      background: ['奶油白 #FFFAF0', '柔粉 #FFF5F7'],
      accents: ['亮粉 #FF69B4', '珊瑚红 #FF6B6B'],
    },
    visualElements: ['爱心', '星星', ' sparkles', '可爱表情', '丝带装饰', '贴纸风格', '柔和圆形'],
    typography: '圆润可爱手写体，柔和阴影， playful 装饰，粉色/马卡龙色文字点缀',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single', 'dual', 'quad'] },
      image_effects: { cutout: 'soft', stroke: ['white-solid', 'colored-solid'], filter: ['clear-glow', 'cream-skin'] },
      typography: { decorated: ['bubble', 'highlight'], tags: ['pill', 'bubble'], direction: ['horizontal'] },
      decorations: { emphasis: ['star-burst', 'hearts'], background: ['solid-pastel', 'gradient-linear'], doodles: ['hearts', 'stars-sparkles', 'flowers'], frames: ['polaroid', 'tape-corners'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓✓', dense: '✓', list: '✓✓', comparison: '✓', flow: '✓', mindmap: '✓', quadrant: '✓' },
    bestFor: ['生活方式', '美妆护肤', '时尚穿搭', '日常技巧', '个人分享'],
  },
  fresh: {
    name: '清新自然风',
    category: 'natural',
    colorPalette: {
      primary: ['薄荷绿 #9AE6B4', '天蓝 #90CDF4', '浅黄 #FAF089'],
      background: ['纯白 #FFFFFF', '柔薄荷 #F0FFF4'],
      accents: ['叶绿 #48BB78', '水蓝 #4299E1'],
    },
    visualElements: ['植物叶子', '云朵', '水滴', '简约几何', '呼吸空间', '自然有机元素'],
    typography: '清新简洁手写体， airy 间距，新鲜色彩点缀',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single', 'triptych'] },
      image_effects: { cutout: 'soft', stroke: ['white-solid', 'none'], filter: ['clear-glow', 'cool-tone'] },
      typography: { decorated: ['none', 'highlight'], tags: ['pill', 'white-black'], direction: ['horizontal'] },
      decorations: { emphasis: ['checkmark', 'circle-mark'], background: ['solid-white', 'solid-pastel'], doodles: ['leaves', 'clouds', 'bubbles'], frames: ['rounded-rect', 'none'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓✓', dense: '✓', list: '✓', comparison: '✓', flow: '✓✓', mindmap: '✓', quadrant: '✓' },
    bestFor: ['健康养生', '极简生活', '自我护理', '自然主题', '清洁生活技巧'],
  },
  warm: {
    name: '温暖治愈风',
    category: 'cozy',
    colorPalette: {
      primary: ['暖橙 #ED8936', '金黄 #F6AD55', '赤陶 #C05621'],
      background: ['奶油白 #FFFAF0', '柔桃 #FED7AA'],
      accents: ['深棕 #744210', '柔红 #E57373'],
    },
    visualElements: ['阳光射线', '咖啡杯', '舒适物品', '温暖光效', '友好装饰', '柔软形状'],
    typography: '友好圆润手写体，温暖色彩点缀，舒适亲切感',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single', 'dual'] },
      image_effects: { cutout: 'soft', stroke: ['white-solid', 'glow'], filter: ['warm-tone', 'cream-skin'] },
      typography: { decorated: ['highlight', 'handwritten'], tags: ['ribbon', 'bubble'], direction: ['horizontal'] },
      decorations: { emphasis: ['star-burst', 'hearts'], background: ['solid-pastel', 'gradient-radial'], doodles: ['clouds', 'stars-sparkles'], frames: ['polaroid', 'tape-corners'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓✓', dense: '✓', list: '✓', comparison: '✓✓', flow: '✓', mindmap: '✓', quadrant: '✓' },
    bestFor: ['个人故事', '生活感悟', '情感内容', '舒适生活', '真诚分享'],
  },
  bold: {
    name: '大胆撞色风',
    category: 'impact',
    colorPalette: {
      primary: ['活力红 #E53E3E', '橙色 #DD6B20', '黄色 #F6E05E'],
      background: ['深黑 #000000', '深炭灰 #1A1A1A'],
      accents: ['白色 #FFFFFF', '霓虹黄 #F7FF00'],
    },
    visualElements: ['感叹号', '箭头', '警告图标', '强烈形状', '高对比元素', '戏剧性构图', '大胆几何'],
    typography: '大胆 impactful 手写体带阴影，高对比文字处理，大而醒目的标题',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single', 'dual'] },
      image_effects: { cutout: 'clean', stroke: ['colored-solid', 'double'], filter: ['high-saturation'] },
      typography: { decorated: ['shadow-3d', 'stroke-text'], tags: ['black-white', 'ribbon'], direction: ['horizontal', 'diagonal'] },
      decorations: { emphasis: ['exclamation', 'star-burst', 'red-arrow'], background: ['solid-saturated', 'gradient-linear'], doodles: ['arrows-curvy', 'squiggles'], frames: ['none'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓', dense: '✓', list: '✓✓', comparison: '✓✓', flow: '✓', mindmap: '✓', quadrant: '✓✓' },
    bestFor: ['重要提示和警告', '必知内容', '关键公告', '排名对比', '吸引注意力的钩子'],
  },
  minimal: {
    name: '极简高级风',
    category: 'elegant',
    colorPalette: {
      primary: ['黑色 #000000', '白色 #FFFFFF'],
      background: ['灰白 #FAFAFA', '纯白 #FFFFFF'],
      accents: ['单一强调色（内容相关）'],
    },
    visualElements: ['单一焦点', '细线条', '最大留白', '简约装饰', '克制视觉元素'],
    typography: '干净简洁手写体，最小粗细变化，优雅间距',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single'] },
      image_effects: { cutout: 'clean', stroke: ['none', 'white-solid'], filter: ['none', 'muted-tones'] },
      typography: { decorated: ['none'], tags: ['white-black', 'pill'], direction: ['horizontal'] },
      decorations: { emphasis: ['underline', 'circle-mark'], background: ['solid-white', 'solid-pastel'], doodles: ['hand-drawn-lines'], frames: ['none', 'rounded-rect'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓✓', dense: '✓✓', list: '✓', comparison: '✓', flow: '✓', mindmap: '✓', quadrant: '✓' },
    bestFor: ['专业内容', '严肃话题', '优雅展示', '高端产品', '商务内容'],
  },
  retro: {
    name: '复古怀旧风',
    category: 'vintage',
    colorPalette: {
      primary: ['柔橙 #E07A4D', '尘粉 #D4A5A5', '褪色青绿 #6B9999'],
      background: ['旧纸张 #F5E6D3', ' sepia #E8DCC8'],
      accents: ['褪色红 #C55A5A', '复古金 #B8860B'],
    },
    visualElements: ['半色调点', '复古徽章', '经典图标', '胶带效果', '做旧纹理叠加', '怀旧装饰元素'],
    typography: '复古风格手写体，经典质感带不完美，做旧纹理文字',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single', 'dual'] },
      image_effects: { cutout: 'stylized', stroke: ['dashed', 'double'], filter: ['film-grain', 'muted-tones'] },
      typography: { decorated: ['brush', 'handwritten'], tags: ['stamp', 'ribbon'], direction: ['horizontal'] },
      decorations: { emphasis: ['star-burst', 'numbering'], background: ['paper-texture', 'dots'], doodles: ['stars-sparkles', 'squiggles'], frames: ['polaroid', 'film-strip', 'stamp-border'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓✓', dense: '✓', list: '✓✓', comparison: '✓', flow: '✓', mindmap: '✓', quadrant: '✓' },
    bestFor: ['怀旧内容', '经典技巧', '永恒建议', '复古美学', ' nostalgic 分享'],
  },
  pop: {
    name: '潮流活泼风',
    category: 'energetic',
    colorPalette: {
      primary: ['亮红 #F56565', '黄色 #ECC94B', '蓝色 #4299E1', '绿色 #48BB78'],
      background: ['白色 #FFFFFF', '浅灰 #F7FAFC'],
      accents: ['霓虹粉 #FF69B4', '电光紫 #9F7AEA'],
    },
    visualElements: ['大胆形状', '对话气泡', '漫画效果', '星爆', '动态活力构图', '高能量装饰'],
    typography: '动态活力手写体带轮廓，大胆色彩组合， playful 表达形式',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single', 'quad'] },
      image_effects: { cutout: 'stylized', stroke: ['colored-solid', 'double'], filter: ['high-saturation'] },
      typography: { decorated: ['stroke-text', 'shadow-3d'], tags: ['bubble', 'ribbon'], direction: ['horizontal', 'curved'] },
      decorations: { emphasis: ['star-burst', 'exclamation'], background: ['solid-saturated', 'dots'], doodles: ['stars-sparkles', 'confetti', 'squiggles'], frames: ['none'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓✓', dense: '✓', list: '✓✓', comparison: '✓✓', flow: '✓', mindmap: '✓', quadrant: '✓' },
    bestFor: ['激动人心的公告', '趣味知识', '引人入胜的教程', '娱乐内容', '面向年轻人的内容'],
  },
  notion: {
    name: '知识卡片风',
    category: 'minimal',
    colorPalette: {
      primary: ['黑色 #1A1A1A', '深灰 #4A4A4A'],
      background: ['纯白 #FFFFFF', '灰白 #FAFAFA'],
      accents: ['淡蓝 #A8D4F0', '淡黄 #F9E79F', '淡粉 #FADBD8'],
    },
    visualElements: ['简约线条涂鸦', '手绘抖动感', '几何形状', '火柴人', '最大留白', '单重量墨线', '干净不杂乱构图'],
    typography: '干净手绘字体，简单无衬线标签，文字最小装饰',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single', 'dual'] },
      image_effects: { cutout: 'clean', stroke: ['none', 'white-solid'], filter: ['none', 'muted-tones'] },
      typography: { decorated: ['none', 'handwritten'], tags: ['black-white', 'pill'], direction: ['horizontal'] },
      decorations: { emphasis: ['circle-mark', 'underline'], background: ['solid-white', 'paper-texture'], doodles: ['hand-drawn-lines', 'arrows-curvy'], frames: ['none', 'rounded-rect'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓✓', dense: '✓✓', list: '✓✓', comparison: '✓✓', flow: '✓✓', mindmap: '✓✓', quadrant: '✓✓' },
    bestFor: ['知识分享', '概念解释', 'SaaS 内容', '生产力技巧', '技术教程', '专业内容'],
  },
  chalkboard: {
    name: '黑板教学风',
    category: 'educational',
    colorPalette: {
      primary: ['粉笔白 #F5F5F5'],
      background: ['黑板黑 #1A1A1A', '绿黑 #1C2B1C'],
      accents: ['粉笔黄 #FFE566', '粉笔粉 #FF9999', '粉笔蓝 #66B3FF', '粉笔绿 #90EE90', '粉笔橙 #FFB366'],
    },
    visualElements: ['手绘粉笔插画带粗糙不完美线条', '文字周围粉笔灰尘效果', '涂鸦：星星/箭头/下划线/圆圈/对勾', '数学公式和简单图表', '橡皮擦污渍和粉笔残留纹理', '火柴人和简单图标', '手绘感连接线'],
    typography: '手绘粉笔字体风格，所有文字可见粉笔纹理，不完美基线增加真实感，白色或亮彩色粉笔强调',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single', 'dual', 'triptych'] },
      image_effects: { cutout: 'stylized', stroke: ['none'], filter: ['none'] },
      typography: { decorated: ['handwritten'], tags: ['none'], direction: ['horizontal', 'vertical'] },
      decorations: { emphasis: ['underline', 'circle-mark', 'arrows-curvy'], background: ['chalkboard'], doodles: ['hand-drawn-lines', 'stars-sparkles'], frames: ['none'] },
    },
    bestLayouts: { sparse: '✓✓', balanced: '✓✓', dense: '✓✓', list: '✓✓', comparison: '✓', flow: '✓✓', mindmap: '✓✓', quadrant: '✓' },
    bestFor: ['教育内容', '教程和指南', '课堂主题', '教学材料', '工作坊', '非正式学习课程', '知识分享'],
    doAndDont: {
      do: ['保持所有元素真实粉笔纹理', '全程使用不完美手绘质感', '添加微妙的粉笔灰尘和污渍效果', '用色彩变化创建视觉层次', '包含 playful 涂鸦和注释'],
      dont: ['使用完美几何形状', '创建干净数字感线条', '添加照片级真实元素', '使用渐变或光泽效果'],
    },
  },
  'study-notes': {
    name: '手写笔记风',
    category: 'realistic',
    colorPalette: {
      primary: ['蓝圆珠笔 #1E3A5F', '黑墨水 #1A1A1A'],
      background: ['白纸 #FFFFFF'],
      accents: ['黄色荧光笔 #FFFF00 (50% 透明度)', '红笔批注 #CC0000'],
    },
    visualElements: ['真实照片视角：学习桌俯视图', '手握蓝圆珠笔主动下划线', '极密手写内容填满整页', '红笔批注：圆圈/下划线/星星/方框', '黄色荧光笔标记关键术语', '修正标记，挤在页边空白处的注释', '简单手绘符号：→ * ✓ ✗ !', '不同笔压产生轻重笔画'],
    typography: '真实学生手写体，凌乱但可读保持清晰结构，不同字号（大标题/小正文/极小页边注），CJK 优化',
    elementCombination: {
      canvas: { ratio: 'portrait-3-4', grid: ['single'] },
      image_effects: { cutout: 'none', stroke: ['none'], filter: ['natural-photo'] },
      typography: { decorated: ['none'], tags: ['none'], direction: ['horizontal'] },
      decorations: { emphasis: ['circle-mark', 'underline', 'checkmark', 'cross', 'star-simple'], background: ['lined-paper-white'], doodles: ['arrows-simple', 'margin-notes', 'corrections', 'explanatory-diagrams'], frames: ['none'] },
    },
    bestLayouts: { sparse: '✗', balanced: '✓', dense: '✓✓', list: '✓✓', comparison: '✓', flow: '✓', mindmap: '✓✓', quadrant: '✓' },
    bestFor: ['学习指南/考试笔记', '知识组织/框架总结', '教程总结/快速笔记', '"学霸笔记"风格内容', '需要真实感的知识分享'],
    doAndDont: {
      do: ['保持内容极密', '使用简单符号（→ * ✓ ✗ !）', '用红笔标注关键点', '包含修正标记', '将微小注释挤进页边空白'],
      dont: ['使用复杂 emoji', '留太多空白', '做整齐布局', '添加彩色装饰', '包含卡通元素'],
    },
  },
}

// 布局定义
const layoutPresets: Record<string, {
  name: string
  density: string
  whitespace: string
  structure: string
  recommended: string
}> = {
  sparse: {
    name: '稀疏简约',
    density: '1-2 个重点',
    whitespace: '60-70% 留白',
    structure: '中心聚焦，大量留白',
    recommended: '封面图、金句图',
  },
  balanced: {
    name: '平衡标准',
    density: '3-4 个重点',
    whitespace: '40-50% 留白',
    structure: '上下结构，标题 + 内容',
    recommended: '标准内容图',
  },
  dense: {
    name: '密集信息',
    density: '5-8 个重点',
    whitespace: '20-30% 留白',
    structure: '知识卡片式，分块展示',
    recommended: '干货总结、清单',
  },
  list: {
    name: '列表清单',
    density: '4-7 个条目',
    whitespace: '30-40% 留白',
    structure: '编号列表，垂直排列',
    recommended: '排名、清单、步骤',
  },
  comparison: {
    name: '对比对照',
    density: '2 个对比项',
    whitespace: '40-50% 留白',
    structure: '左右分屏，对比展示',
    recommended: '前后对比、优劣对比',
  },
  flow: {
    name: '流程步骤',
    density: '3-6 个步骤',
    whitespace: '30-40% 留白',
    structure: '时间线/流程图，箭头引导',
    recommended: '教程、流程、时间线',
  },
}

/**
 * 步骤 1: 深度分析文案（对应 analysis.md）
 */
async function analyzeContent(content: string, title: string, imageCount: number, useClaude: boolean) {
  const callAIFunction = useClaude ? callNovaAIClaude : callAI
  
  const analysisPrompt = `你是小红书内容策划专家。请**完整、仔细地阅读**以下文案的**每一句话**，然后进行深度分析。

## 文案内容
**标题**: ${title}

**完整正文**:
${content}

---

## 分析任务

### 1. 文案概览
- 这篇文案的**核心主题**是什么？（用 1 句话总结）
- 文案的**情绪基调**是什么？（兴奋/专业/温暖/幽默/其他）
- 文案的**目标受众**是谁？

### 2. 内容类型识别
从以下类型中选择最匹配的：
- 种草/安利（产品推荐）
- 干货分享（知识/技巧/教程）
- 个人故事（经历/情感）
- 测评对比（评测/对比）
- 教程步骤（步骤指南）
- 避坑指南（警告/注意事项）
- 清单合集（推荐列表）

### 3. 内容要点提取
**重要**：请列出文案中提到的**所有**要点/技巧/步骤/观点，不要遗漏！
- 要点 1: [具体内容]
- 要点 2: [具体内容]
- 要点 3: [具体内容]
- ...（列出所有要点）

### 4. 亮点识别
找出文案中最有吸引力的 3-5 个亮点（爆款潜力）：
- 亮点 1: [具体描述]
- 亮点 2: [具体描述]
- 亮点 3: [具体描述]

### 5. 钩子分析
评估标题/钩子潜力（1-5 星）：
- 数字钩子（如"5 个方法"）：有/无
- 痛点钩子（如"踩过的坑"）：有/无
- 好奇钩子（如"原来..."）：有/无
- 利益钩子（如"省钱/变美"）：有/无
- 身份钩子（如"打工人必看"）：有/无
- 综合评分：⭐⭐⭐⭐⭐ (5/5)

### 6. 收藏/分享价值
- **收藏价值**：为什么用户会收藏？（参考材料/清单/教程）
- **分享触发**：什么会使用户分享？（实用/共鸣/娱乐）
- **评论诱导**：如何引导用户评论？（提问/讨论/帮助）

### 7. 图片分配建议
**重要**：文案的**所有要点必须全部分配**到${imageCount}张图中，不能遗漏任何内容！

**分配原则**：
- 如果图片数量少（如 3 张）：每张图包含多个要点，合理分组
- 如果图片数量多（如 8 张）：每张图包含更少的要点，更详细
- **必须确保文案的所有要点都被分配到某张图中**

请给出分配建议：
- 第 1 张（封面）：应该展示什么？
- 第 2-${imageCount - 1}张（内容）：每张展示哪些要点？（必须覆盖所有要点）
- 第${imageCount}张（结尾）：如何总结并引导互动？

### 8. 推荐风格与布局
基于内容信号，推荐最适合的风格和布局组合（参考 baoyu skill 的 auto selection）：
- 如果内容涉及美妆/时尚/可爱/女孩/粉色 → cute + sparse/balanced
- 如果内容涉及健康/自然/清洁/新鲜/有机 → fresh + balanced/flow
- 如果内容涉及生活/故事/情感/温暖 → warm + balanced
- 如果内容涉及警告/重要/必须/关键 → bold + list/comparison
- 如果内容涉及专业/商业/优雅/简单 → minimal + sparse/balanced
- 如果内容涉及经典/复古/老/传统 → retro + balanced
- 如果内容涉及趣味/兴奋/wow/惊人 → pop + sparse/list
- 如果内容涉及知识/概念/生产力/SaaS → notion + dense/list
- 如果内容涉及教育/教程/学习/教学/课堂 → chalkboard + balanced/dense
- 如果内容涉及笔记/手写/学习指南/知识/真实/照片 → study-notes + dense/list/mindmap

---

## 输出格式

请严格按照以下 JSON 格式输出：

{
  "overview": {
    "coreTheme": "核心主题（1 句话）",
    "emotionTone": "情绪基调",
    "targetAudience": "目标受众"
  },
  "contentType": "内容类型（从上述 7 种中选择）",
  "allPoints": [
    "文案中的第 1 个要点（完整内容）",
    "文案中的第 2 个要点（完整内容）",
    "文案中的第 3 个要点（完整内容）",
    "...（列出所有要点，不要遗漏）"
  ],
  "highlights": [
    "亮点 1（具体描述）",
    "亮点 2（具体描述）",
    "亮点 3（具体描述）"
  ],
  "hookAnalysis": {
    "hasNumberHook": true,
    "hasPainPointHook": false,
    "hasCuriosityHook": true,
    "hasBenefitHook": true,
    "hasIdentityHook": false,
    "rating": 4
  },
  "engagementDesign": {
    "saveValue": "为什么用户会收藏",
    "shareTrigger": "什么会使用户分享",
    "commentInducement": "如何引导用户评论"
  },
  "imageAllocation": {
    "cover": "封面图应展示的内容",
    "content": ["第 2 张图展示的要点", "第 3 张图展示的要点"],
    "ending": "结尾图应展示的内容"
  },
  "recommendedStyle": "推荐风格（cute/fresh/warm/bold/minimal/retro/pop/notion/chalkboard/study-notes）",
  "recommendedLayout": "推荐布局（sparse/balanced/dense/list/comparison/flow）",
  "styleReason": "为什么推荐这个风格和布局"
}

## 重要提醒
- **必须阅读完整篇文案**后再回答
- **allPoints 必须包含文案的所有要点**，不能只写前几个
- 每个要点都必须是文案中的**具体内容**，不能是"要点 1"这种空话
- 直接返回 JSON，不要有任何额外解释`

  const analysisSystemPrompt = useClaude 
    ? '你是小红书内容策划专家，擅长深度分析文案并提取所有要点。'
    : undefined
  
  const result = await callAIFunction(analysisPrompt, analysisSystemPrompt)
  
  // 解析 JSON
  try {
    const jsonMatch = result.match(/\{([\s\S]*?)\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('解析分析结果失败:', e)
  }
  
  // 降级处理
  return {
    overview: {
      coreTheme: title || '文案主题',
      emotionTone: '专业',
      targetAudience: '普通用户',
    },
    contentType: '干货分享',
    allPoints: content.split('\n').filter(line => line.trim().length > 10).slice(0, 20),
    highlights: [],
    hookAnalysis: { rating: 3 },
    engagementDesign: {},
    imageAllocation: {
      cover: title || '封面',
      content: [],
      ending: '总结互动',
    },
    recommendedStyle: 'notion',
    recommendedLayout: 'balanced',
    styleReason: '默认推荐',
  }
}

/**
 * 步骤 2: 生成 3 种大纲策略（对应 outline-strategy-a/b/c.md）
 */
async function generateOutlineStrategies(
  analysisData: any,
  imageCount: number,
  style: string,
  layout: string,
  useClaude: boolean
) {
  const callAIFunction = useClaude ? callNovaAIClaude : callAI
  
  const outlinePrompt = `你是小红书视觉策划专家。请根据以下文案分析结果，为${imageCount}张配图生成**三种不同的策略变体**。

## 文案分析结果
**核心主题**: ${analysisData.overview?.coreTheme || '无'}
**内容类型**: ${analysisData.contentType || '干货分享'}
**情绪基调**: ${analysisData.overview?.emotionTone || '专业'}
**所有要点** (${analysisData.allPoints?.length || 0}个):
${analysisData.allPoints?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || '无'}
**亮点**:
${analysisData.highlights?.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n') || '无'}
**推荐风格**: ${analysisData.recommendedStyle || style}
**推荐布局**: ${analysisData.recommendedLayout || layout}

---

## 三种策略

### 策略 A: 故事驱动型 (Story-Driven)
- **概念**：以个人经历为主线，情感共鸣优先
- **特点**：从痛点出发，展示前后变化，强调真实性
- **适合**：测评/个人分享/转变故事
- **结构**：钩子 → 问题 → 发现 → 体验 → 结论
- **推荐风格**：warm / cute / fresh
- **页数**：通常 4-6 页

### 策略 B: 信息密集型 (Information-Dense)
- **概念**：价值优先，高效信息传递
- **特点**：结构清晰，要点明确，专业可信
- **适合**：教程/对比/测评/清单
- **结构**：核心结论 → 信息卡片 → 优缺点 → 推荐
- **推荐风格**：notion / minimal / chalkboard
- **页数**：通常 3-5 页

### 策略 C: 视觉优先型 (Visual-First)
- **概念**：视觉冲击为核心，最小化文字
- **特点**：大图，氛围感，即时吸引力
- **适合**：高美学产品/生活方式/情绪内容
- **结构**：主图 → 细节图 → 生活场景 → CTA
- **推荐风格**：bold / pop / retro
- **页数**：通常 3-4 页

---

## 你的任务

为每种策略生成完整的${imageCount}张图大纲。

**重要要求**：
1. **必须覆盖文案的所有要点**：analysisData.allPoints 中的每个要点都必须分配到某张图中
2. **智能分配**：
   - 3 张图：封面 (1 个要点) + 内容 1(多个要点) + 内容 2(多个要点) + 结尾 (总结)
   - 4 张图：封面 (1 个要点) + 内容 1(多个要点) + 内容 2(多个要点) + 结尾 (总结)
   - 8 张图：封面 (1 个要点) + 内容 1-6(每张 1-2 个要点) + 结尾 (总结)
3. **三种策略必须有明显差异**：
   - 策略 A：情感化，个人化，前后对比
   - 策略 B：结构化，事实性，知识卡片
   - 策略 C：视觉化，氛围感，最小文字

### 每张图必须包含：

**图片信息**：
- **位置**: Cover（封面）/ Content（内容）/ Ending（结尾）
- **布局**: 从以下选择：sparse / balanced / dense / list / comparison / flow
- **标题**: 本图的主标题文字（必须具体）
- **副标题**: 本图的副标题（可选）

**文字内容**：
列出本图要展示的**所有文字**：
- 主标题
- 副标题
- 要点列表（从文案中提取具体内容）
- 装饰性文字

**视觉概念**（详细描述，至少 50 字）：
- 画面中心是什么？
- 元素如何排布？
- 使用什么图表或图示？
- 整体氛围如何？
- 色彩如何搭配？

**视觉元素**（具体可视觉化）：
从文案内容中提取**具体的、可视觉化的元素**，例如：
- 如果文案提到"AI 机器人"，元素就是"AI 机器人图标"
- 如果文案提到"92% 准确率"，元素就是"92% 数字、进度条"

**引导钩子**：
写一句引导用户滑到下一张图的话

---

## 输出格式

请严格按照以下 JSON 格式输出：

{
  "strategies": {
    "a": {
      "name": "Story-Driven",
      "recommendedStyle": "warm",
      "styleReason": "温暖色调增强情感故事和个人连接",
      "defaultLayout": "balanced",
      "imageCount": ${imageCount},
      "images": [
        {
          "imageIndex": 1,
          "position": "Cover",
          "layout": "sparse",
          "title": "具体的标题文字",
          "subtitle": "具体的副标题",
          "textElements": [
            {"type": "title", "content": "主标题文字"},
            {"type": "subtitle", "content": "副标题文字"}
          ],
          "coreMessage": "本图要传达的核心信息",
          "visualElements": ["具体的视觉元素 1", "具体的视觉元素 2"],
          "visualConcept": "详细的视觉概念描述（至少 50 字）",
          "swipeHook": "引导滑到下一张的钩子文字"
        }
        // ... 直到${imageCount}张图
      ]
    },
    "b": {
      "name": "Information-Dense",
      "recommendedStyle": "notion",
      "styleReason": "知识卡片风格适合干货分享",
      "defaultLayout": "dense",
      "imageCount": ${imageCount},
      "images": [
        // ... 同上
      ]
    },
    "c": {
      "name": "Visual-First",
      "recommendedStyle": "bold",
      "styleReason": "视觉冲击力吸引注意力",
      "defaultLayout": "sparse",
      "imageCount": ${imageCount},
      "images": [
        // ... 同上
      ]
    }
  }
}

## 重要要求

1. **每个策略的 images 数组必须恰好有${imageCount}个元素**
2. **所有文字内容必须具体**：不能是"标题"、"要点 1"这种空话
3. **visualElements 必须可视觉化**：必须是具体的元素
4. **visualConcept 必须详细**：至少 50 字的详细描述
5. **必须覆盖文案的所有要点**：
   - 检查 analysisData.allPoints 中的所有要点是否都被分配到某张图中
   - **绝对不能遗漏任何要点**

直接返回 JSON，不要有任何额外解释。`

  const outlineSystemPrompt = useClaude
    ? '你是小红书视觉策划专家，擅长为文案生成详细的图片大纲。'
    : undefined
  
  const result = await callAIFunction(outlinePrompt, outlineSystemPrompt)
  
  // 解析 JSON
  try {
    const jsonMatch = result.match(/\{([\s\S]*?)\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('解析大纲失败:', e)
  }
  
  return null
}

/**
 * 步骤 3: 根据选定策略生成提示词（对应 prompt assembly）
 */
function assemblePrompts(
  selectedStrategy: any,
  style: string,
  ratio: string
): string[] {
  const preset = stylePresets[style] || stylePresets.notion
  
  const prompts: string[] = []
  
  for (const image of selectedStrategy.images) {
    // 构建文字内容
    const textContent = image.textElements?.map((el: any) => {
      if (el.type === 'title') return `📌 标题：${el.content}`
      if (el.type === 'subtitle') return `📍 副标题：${el.content}`
      if (el.type === 'point') return `• ${el.content}`
      if (el.type === 'decoration') return `✨ ${el.content}`
      return el.content
    }).join('\n') || image.title

    // 组装风格部分
    const styleSection = `## 风格：${preset.name}

**配色方案**:
- 主色：${preset.colorPalette.primary.join(', ')}
- 背景：${preset.colorPalette.background.join(', ')}
- 强调色：${preset.colorPalette.accents.join(', ')}

**视觉元素**:
${preset.visualElements.join(', ')}

**字体风格**:
${preset.typography}

**元素组合**:
- 画布：${preset.elementCombination.canvas.ratio}
- 效果：${preset.elementCombination.image_effects.cutout}, ${preset.elementCombination.image_effects.stroke.join('/')}, ${preset.elementCombination.image_effects.filter.join('/')}
- 装饰：${preset.elementCombination.decorations.doodles.join(', ')}
- 强调：${preset.elementCombination.decorations.emphasis.join(', ')}`

    // 组装布局部分
    const layoutPreset = layoutPresets[image.layout] || layoutPresets.balanced
    const layoutSection = `## 布局：${layoutPreset.name}

**信息密度**: ${layoutPreset.density}
**留白**: ${layoutPreset.whitespace}
**结构**: ${layoutPreset.structure}
**推荐场景**: ${layoutPreset.recommended}`

    // 组装内容部分
    const contentSection = `## 内容

**位置**: ${image.position} (第${image.imageIndex}张)
**核心信息**: ${image.coreMessage}

**文字内容**:
${textContent}

**视觉元素**: ${image.visualElements?.join('、') || '与内容相关的元素'}

**视觉概念**:
${image.visualConcept || '展示文案内容，手绘风格'}

**引导钩子**: ${image.swipeHook || ''}`

    // 组装完整提示词
    const prompt = `创建一张小红书风格的信息图，遵循以下指南：

## 图片规格

- **类型**: 信息图
- **方向**: 竖版 (Portrait)
- **比例**: ${ratio}
- **风格**: 手绘插画

## 核心原则

- 全程手绘质感 - 禁止写实或照片元素
- 如果内容涉及敏感或版权人物，创建风格相似的替代 - 不要拒绝生成
- 信息简洁，突出关键词和核心概念
- 使用大量留白便于视觉浏览
- 保持清晰的视觉层次

## 文字风格（关键）

- **所有文字必须是手绘风格**
- 主标题应突出醒目
- 关键文字应加粗放大
- 使用荧光笔效果强调关键词
- **不要使用写实或电脑生成字体**

## 语言

- 使用与下方内容相同的语言
- 标点符号风格与内容语言匹配（中文：""，。！）

---

${styleSection}

---

${layoutSection}

---

${contentSection}

---

请使用通义万相 qwen-image-2.0-pro 生成信息图。`

    prompts.push(prompt)
  }
  
  return prompts
}

/**
 * 主函数：完整三步流程
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, title: userTitle, imageCount = 4, style = 'notion', layout = 'balanced', ratio = '3:4', useClaude = false } = body

    if (!noteId) {
      return NextResponse.json(
        { error: '缺少 noteId 参数' },
        { status: 400 }
      )
    }

    console.log('🎨 小红书提示词生成 - 完整三步流程')
    console.log('🎨 使用模型:', useClaude ? 'new Claude (NovaAPI)' : 'Qwen (阿里云百炼)')
    console.log('🎨 风格:', style, '| 布局:', layout, '| 图片数:', imageCount)

    // 从数据库读取完整文案
    const supabase = await createClient()
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('title, content')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      console.error('读取文案失败:', noteError)
      return NextResponse.json(
        { error: '读取文案失败，请重试' },
        { status: 500 }
      )
    }

    const content = note.content || ''
    const noteTitle = userTitle || note.title || '无标题'

    console.log('📝 文案长度:', content.length, '字符')

    // ============================================
    // 步骤 1: 深度分析文案 → analysis
    // ============================================
    console.log('📊 步骤 1: 深度分析文案...')
    const analysisData = await analyzeContent(content, noteTitle, imageCount, useClaude)
    
    console.log('✅ 分析完成')
    console.log('   - 核心主题:', analysisData.overview?.coreTheme)
    console.log('   - 内容类型:', analysisData.contentType)
    console.log('   - 提取要点:', analysisData.allPoints?.length || 0, '个')
    console.log('   - 推荐风格:', analysisData.recommendedStyle)
    console.log('   - 推荐布局:', analysisData.recommendedLayout)

    // ============================================
    // 步骤 2: 生成 3 种大纲策略 → outline strategies
    // ============================================
    console.log('📋 步骤 2: 生成 3 种大纲策略...')
    const outlineStrategies = await generateOutlineStrategies(
      analysisData,
      imageCount,
      style,
      layout,
      useClaude
    )
    
    if (!outlineStrategies?.strategies) {
      console.warn('⚠️ 大纲生成失败，使用简化处理')
      // 降级处理：使用用户选择的风格直接生成
      return NextResponse.json({
        success: true,
        prompts: Array(imageCount).fill('生成提示词失败，请重试'),
        analysis: analysisData,
        strategies: null,
        selectedStrategy: null,
      })
    }
    
    console.log('✅ 大纲策略生成完成')
    console.log('   - 策略 A:', outlineStrategies.strategies.a?.name, '| 风格:', outlineStrategies.strategies.a?.recommendedStyle)
    console.log('   - 策略 B:', outlineStrategies.strategies.b?.name, '| 风格:', outlineStrategies.strategies.b?.recommendedStyle)
    console.log('   - 策略 C:', outlineStrategies.strategies.c?.name, '| 风格:', outlineStrategies.strategies.c?.recommendedStyle)

    // ============================================
    // 步骤 3: 选择最优策略并生成提示词 → prompts
    // ============================================
    console.log('🎨 步骤 3: 选择最优策略并生成提示词...')
    
    // 自动选择策略：优先使用策略 B（信息密集型），因为最适合干货分享
    // 或者根据内容类型智能选择
    let selectedStrategyKey: 'a' | 'b' | 'c' = 'b'
    
    if (analysisData.contentType === '个人故事' || analysisData.contentType === '种草/安利') {
      selectedStrategyKey = 'a' // 故事驱动
    } else if (analysisData.recommendedStyle === 'bold' || analysisData.recommendedStyle === 'pop') {
      selectedStrategyKey = 'c' // 视觉优先
    }
    
    const selectedStrategy = outlineStrategies.strategies[selectedStrategyKey]
    
    console.log('✅ 选择策略:', selectedStrategy.name, '| 风格:', selectedStrategy.recommendedStyle)
    
    // 使用选定策略的风格（而不是用户选择的风格）来组装提示词
    const finalStyle = selectedStrategy.recommendedStyle || style
    const finalLayout = selectedStrategy.defaultLayout || layout
    
    // 生成提示词
    const prompts = assemblePrompts(selectedStrategy, finalStyle, ratio)
    
    console.log('✅ 提示词生成完成，共', prompts.length, '条')
    
    // 验证要点覆盖
    const allPointsCount = analysisData.allPoints?.length || 0
    const outlinePointsCount = selectedStrategy.images?.reduce((count: number, img: any) => {
      return count + (img.textElements?.length || 0)
    }, 0) || 0
    
    console.log('📝 要点覆盖检查:')
    console.log('   - 文案要点总数:', allPointsCount)
    console.log('   - 大纲中分配的要点数:', outlinePointsCount)
    
    if (outlinePointsCount < allPointsCount * 0.8) {
      console.warn('⚠️ 警告：大纲可能遗漏了要点（覆盖率 < 80%）')
    } else {
      console.log('✅ 大纲已覆盖所有要点')
    }
    
    return NextResponse.json({
      success: true,
      prompts: prompts,
      analysis: analysisData,
      strategies: outlineStrategies.strategies,
      selectedStrategy: {
        key: selectedStrategyKey,
        name: selectedStrategy.name,
        style: finalStyle,
        layout: finalLayout,
      },
    })
  } catch (error) {
    console.error('Failed to generate prompts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成提示词失败' },
      { status: 500 }
    )
  }
}

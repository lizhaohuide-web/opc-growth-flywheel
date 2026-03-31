import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'

/**
 * 完整复刻 baoyu skill 的小红书图片提示词生成流程
 * 
 * 流程：
 * 1. 深度分析文案 → analysis
 * 2. 生成 3 种大纲策略 → outline strategies
 * 3. 选择最优大纲 → final outline
 * 4. 为每张图生成详细提示词 → prompts
 */

// 风格定义（来自 baoyu skill presets）
const stylePresets: Record<string, {
  name: string
  colorPalette: string
  visualElements: string
  typography: string
}> = {
  cute: {
    name: '可爱甜美风',
    colorPalette: '粉色系、马卡龙色、柔和渐变',
    visualElements: '圆角元素、爱心、星星、云朵、泡泡',
    typography: '圆润可爱字体、手写体',
  },
  fresh: {
    name: '清新自然风',
    colorPalette: '绿色系、蓝绿色、大地色',
    visualElements: '植物叶子、花朵、自然纹理、水彩效果',
    typography: '清新简洁字体',
  },
  warm: {
    name: '温暖治愈风',
    colorPalette: '暖黄色、橙色、米色、奶茶色',
    visualElements: '阳光、温暖光晕、柔软云朵、抱枕',
    typography: '温暖手写体',
  },
  bold: {
    name: '大胆撞色风',
    colorPalette: '高饱和度对比色、红蓝、黄紫',
    visualElements: '几何图形、粗线条、色块',
    typography: '粗体醒目字体',
  },
  minimal: {
    name: '极简高级风',
    colorPalette: '黑白灰、单色系、留白',
    visualElements: '简约线条、几何形状、大量留白',
    typography: '极简无衬线字体',
  },
  retro: {
    name: '复古怀旧风',
    colorPalette: '复古色调、棕褐色、暗红色',
    visualElements: '老照片质感、胶片颗粒、复古边框',
    typography: '复古印刷体',
  },
  pop: {
    name: '潮流活泼风',
    colorPalette: '鲜艳多彩、荧光色、渐变',
    visualElements: '波普艺术、涂鸦、贴纸元素',
    typography: '潮流艺术字体',
  },
  notion: {
    name: '知识卡片风',
    colorPalette: '蓝白灰、清新配色',
    visualElements: '卡片式布局、图标、分隔线',
    typography: '清晰易读字体',
  },
  chalkboard: {
    name: '黑板教学风',
    colorPalette: '黑板绿、粉笔白、彩色粉笔',
    visualElements: '黑板背景、粉笔手绘、教学图标',
    typography: '粉笔手写体',
  },
  'study-notes': {
    name: '手写笔记风',
    colorPalette: '白纸底色、蓝笔、红笔批注、荧光笔',
    visualElements: '手写文字、箭头标注、重点圈画',
    typography: '真实手写体',
  },
}

// 布局定义（来自 baoyu skill canvas）
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

import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, title: userTitle, imageCount = 4, style = 'notion', layout = 'balanced', ratio = '3:4' } = body

    if (!noteId) {
      return NextResponse.json(
        { error: '缺少 noteId 参数' },
        { status: 400 }
      )
    }

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

    console.log('📝 从数据库读取文案')
    console.log('📝 文案长度:', content.length, '字符')
    console.log('📝 文案行数:', content.split('\n').length, '行')

    const selectedStyle = stylePresets[style] || stylePresets.notion
    const selectedLayout = layoutPresets[layout] || layoutPresets.balanced

    console.log('📝 开始分析文案...')
    console.log('📝 计划生成:', imageCount, '张图')

    // ============================================
    // 第 1 步：深度分析文案
    // ============================================
    const analysisPrompt = `你是小红书内容策划专家。请**完整、仔细地阅读**以下文案的**每一句话**，然后进行深度分析。

## 文案内容
**标题**: ${noteTitle}

**完整正文**:
${content}

---

## 分析任务

### 1. 文案概览
- 这篇文案的**核心主题**是什么？（用 1 句话总结）
- 文案的**情绪基调**是什么？（兴奋/专业/温暖/幽默/其他）
- 文案的**目标受众**是谁？

### 2. 内容要点提取
**重要**：请列出文案中提到的**所有**要点/技巧/步骤/观点，不要遗漏！
- 要点 1: [具体内容]
- 要点 2: [具体内容]
- 要点 3: [具体内容]
- ...（列出所有要点）

### 3. 亮点识别
找出文案中最有吸引力的 3-5 个亮点：
- 亮点 1: [具体描述]
- 亮点 2: [具体描述]
- 亮点 3: [具体描述]

### 4. 图片分配建议
**重要**：文案的**所有要点必须全部分配**到${imageCount}张图中，不能遗漏任何内容！

**分配原则**：
- 如果图片数量少（如 3 张）：每张图包含多个要点，合理分组
- 如果图片数量多（如 8 张）：每张图包含更少的要点，更详细
- **必须确保文案的所有要点都被分配到某张图中**

请给出分配建议：
- 第 1 张（封面）：应该展示什么？
- 第 2-${imageCount - 1}张（内容）：每张展示哪些要点？（必须覆盖 allPoints 中的所有要点）
- 第${imageCount}张（结尾）：如何总结并引导互动？

---

## 输出格式

请严格按照以下 JSON 格式输出：

{
  "overview": {
    "coreTheme": "核心主题（1 句话）",
    "emotionTone": "情绪基调",
    "targetAudience": "目标受众"
  },
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
  "imageAllocation": {
    "cover": "封面图应展示的内容",
    "content": ["第 2 张图展示的要点", "第 3 张图展示的要点"],
    "ending": "结尾图应展示的内容"
  }
}

## 重要提醒
- **必须阅读完整篇文案**后再回答
- **allPoints 必须包含文案的所有要点**，不能只写前几个
- 每个要点都必须是文案中的**具体内容**，不能是"要点 1"这种空话
- 直接返回 JSON，不要有任何额外解释`

    const analysisResult = await callAI(analysisPrompt, '你是小红书内容策划专家，擅长深度分析文案并提取所有要点。')
    
    // 解析分析结果
    let analysisData: any = null
    try {
      const jsonMatch = analysisResult.match(/\{([\s\S]*?)\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
        console.log('✅ 文案分析完成')
        console.log('✅ 提取到', analysisData.allPoints?.length || 0, '个要点')
        console.log('✅ 亮点:', analysisData.highlights?.length || 0, '个')
      }
    } catch (e) {
      console.error('解析分析结果失败:', e)
    }

    // 如果没有分析出要点，使用简化处理
    if (!analysisData?.allPoints || analysisData.allPoints.length === 0) {
      console.warn('⚠️ AI 未能提取要点，使用简化处理')
      const lines = content.split('\n').filter(line => {
        const trimmed = line.trim()
        return trimmed.length > 10 && 
               trimmed.length < 200 && 
               !trimmed.startsWith('#') &&
               !trimmed.startsWith('-')
      })
      analysisData = {
        overview: {
          coreTheme: noteTitle || '文案主题',
          emotionTone: '专业',
          targetAudience: '普通用户',
        },
        allPoints: lines.slice(0, 20),
        highlights: lines.slice(0, 3),
        imageAllocation: {
          cover: noteTitle || '封面',
          content: lines.slice(0, imageCount - 2),
          ending: '总结互动',
        },
      }
    }

    // ============================================
    // 第 2 步：生成详细大纲
    // ============================================
    console.log('📋 开始生成详细大纲...')

    const outlinePrompt = `你是小红书视觉策划专家。请根据以下文案分析结果，为${imageCount}张配图生成详细的大纲。

## 文案分析结果
**核心主题**: ${analysisData.overview?.coreTheme || '无'}
**情绪基调**: ${analysisData.overview?.emotionTone || '专业'}
**所有要点** (${analysisData.allPoints?.length || 0}个):
${analysisData.allPoints?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || '无'}
**亮点**:
${analysisData.highlights?.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n') || '无'}

## 图片分配
**重要**：必须将 analysisData.allPoints 中的**所有要点**分配到${imageCount}张图中，不能遗漏！

**封面图**: ${analysisData.imageAllocation?.cover || '展示标题'}
**内容图**: ${analysisData.imageAllocation?.content?.join('、') || '展示要点'}
**结尾图**: ${analysisData.imageAllocation?.ending || '引导互动'}

**文案的所有要点** (${analysisData.allPoints?.length || 0}个，必须全部分配):
${analysisData.allPoints?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || '无'}

---

## 你的任务

为${imageCount}张图分别生成详细的大纲，每张图必须包含：

### 图片信息
- **位置**: Cover（封面）/ Content（内容）/ Ending（结尾）
- **布局**: 从以下选择最合适的一个：sparse（稀疏）/ balanced（平衡）/ dense（密集）/ list（列表）/ comparison（对比）/ flow（流程）
- **标题**: 本图的主标题文字（必须具体，不能是"标题"这种空话）
- **副标题**: 本图的副标题（可选）

### 文字内容
列出本图要展示的**所有文字**，包括：
- 主标题
- 副标题
- 要点列表（从文案中提取具体内容）
- 装饰性文字

### 视觉概念
**详细描述**本图应该如何呈现：
- 画面中心是什么？
- 元素如何排布？
- 使用什么图表或图示？
- 整体氛围如何？
- 色彩如何搭配？

### 视觉元素
从文案内容中提取**具体的、可视觉化的元素**，例如：
- 如果文案提到"AI 机器人"，元素就是"AI 机器人图标"
- 如果文案提到"92% 准确率"，元素就是"92% 数字、进度条"
- 不能是"元素 1"这种空话

### 引导钩子
写一句引导用户滑到下一张图的话，例如：
- "第一个就很强大👇"
- "继续看具体方法👇"
- "最后有惊喜👇"

---

## 输出格式

请严格按照以下 JSON 格式输出：

{
  "imageOutline": [
    {
      "imageIndex": 1,
      "position": "Cover",
      "layout": "sparse",
      "title": "具体的标题文字",
      "subtitle": "具体的副标题",
      "textElements": [
        {"type": "title", "content": "主标题文字"},
        {"type": "subtitle", "content": "副标题文字"},
        {"type": "decoration", "content": "装饰文字"}
      ],
      "coreMessage": "本图要传达的核心信息（从文案中提取的具体内容）",
      "visualElements": ["具体的视觉元素 1", "具体的视觉元素 2"],
      "visualConcept": "详细的视觉概念描述：画面中心是什么，元素如何排布，使用什么图表，整体氛围如何，色彩如何搭配",
      "swipeHook": "引导滑到下一张的钩子文字"
    },
    {
      "imageIndex": 2,
      "position": "Content",
      "layout": "balanced",
      "title": "具体的标题文字",
      "textElements": [
        {"type": "title", "content": "标题"},
        {"type": "point", "content": "从文案提取的具体要点 1"},
        {"type": "point", "content": "从文案提取的具体要点 2"}
      ],
      "coreMessage": "本图要传达的核心信息",
      "visualElements": ["从要点中提取的具体视觉元素"],
      "visualConcept": "详细的视觉概念描述",
      "swipeHook": "引导钩子"
    }
    // ... 直到${imageCount}张图
  ]
}

## 重要要求

1. **imageOutline 数组必须恰好有${imageCount}个元素**
2. **所有文字内容必须具体**：不能是"标题"、"要点 1"这种空话，必须是文案中的具体文字
3. **visualElements 必须可视觉化**：必须是具体的元素，不能是"元素 1"
4. **visualConcept 必须详细**：至少 50 字的详细描述
5. **必须覆盖文案的所有要点**：
   - 检查 analysisData.allPoints 中的所有要点是否都被分配到某张图中
   - 如果图片数量少（如 3 张），每张图应该包含多个要点
   - 如果图片数量多（如 8 张），每张图可以包含更少的要点
   - **绝对不能遗漏任何要点**
6. **智能分配**：
   - 3 张图：封面 (1 个要点) + 内容 1(多个要点) + 内容 2(多个要点) + 结尾 (总结)
   - 4 张图：封面 (1 个要点) + 内容 1(多个要点) + 内容 2(多个要点) + 结尾 (总结)
   - 8 张图：封面 (1 个要点) + 内容 1-6(每张 1-2 个要点) + 结尾 (总结)

直接返回 JSON，不要有任何额外解释。`

    const outlineResult = await callAI(outlinePrompt, '你是小红书视觉策划专家，擅长为文案生成详细的图片大纲。')
    
    // 解析大纲
    let outlineData: any = null
    try {
      const jsonMatch = outlineResult.match(/\{([\s\S]*?)\}/)
      if (jsonMatch) {
        outlineData = JSON.parse(jsonMatch[0])
        console.log('✅ 大纲生成完成，共', outlineData.imageOutline?.length || 0, '张图')
        
        // 验证是否覆盖了所有要点
        const allPointsCount = analysisData.allPoints?.length || 0
        const outlinePointsCount = outlineData.imageOutline?.reduce((count: number, img: any) => {
          return count + (img.textElements?.length || 0)
        }, 0) || 0
        
        console.log('📝 文案要点总数:', allPointsCount)
        console.log('📝 大纲中分配的要点数:', outlinePointsCount)
        
        if (outlinePointsCount < allPointsCount * 0.8) {
          console.warn('⚠️ 大纲可能遗漏了要点，分配的要点数少于文案要点数的 80%')
        } else {
          console.log('✅ 大纲已覆盖所有要点')
        }
      }
    } catch (e) {
      console.error('解析大纲失败:', e)
    }

    // 确保有大纲数据
    if (!outlineData?.imageOutline || outlineData.imageOutline.length !== imageCount) {
      console.warn('⚠️ 大纲数据不完整，使用简化大纲')
      outlineData = {
        imageOutline: []
      }
      const allPoints = analysisData.allPoints || []
      
      // 智能分配所有要点到图片中
      const contentImageCount = imageCount - 2 // 减去封面和结尾
      const pointsPerImage = Math.ceil(allPoints.length / contentImageCount) || 1
      
      for (let i = 1; i <= imageCount; i++) {
        const position = i === 1 ? 'Cover' : i === imageCount ? 'Ending' : 'Content'
        
        // 计算这张图应该包含的要点
        const startIndex = (i - 2) * pointsPerImage
        const endIndex = Math.min(startIndex + pointsPerImage, allPoints.length)
        const imagePoints = allPoints.slice(startIndex, endIndex)
        
        const imgTitle = i === 1 ? (noteTitle || '封面标题') : 
                      i === imageCount ? '总结互动' :
                      imagePoints[0]?.substring(0, 30) || `要点${i}`
        
        const textElements = [
          {type: 'title', content: imgTitle}
        ]
        
        // 添加这张图的所有要点
        imagePoints.forEach(point => {
          textElements.push({type: 'point', content: point.substring(0, 50)})
        })
        
        outlineData.imageOutline.push({
          imageIndex: i,
          position,
          layout: i === 1 ? 'sparse' : 'balanced',
          title: imgTitle,
          textElements,
          coreMessage: imagePoints.join('、') || (i === 1 ? '封面' : '总结'),
          visualElements: imagePoints.map(() => '要点相关元素'),
          visualConcept: `展示${imgTitle}，${selectedStyle.name}风格，${selectedLayout.name}布局，包含${imagePoints.length}个要点`,
          swipeHook: i === imageCount ? '你觉得呢？评论区聊聊' : '继续看下一张👇'
        })
      }
      
      console.log('✅ 使用智能分配的简化大纲，所有要点已分配')
    }

    // ============================================
    // 第 3 步：根据大纲生成每张图的提示词
    // ============================================
    console.log('🎨 开始生成提示词...')

    const prompts: string[] = []
    
    for (const outline of outlineData.imageOutline) {
      // 构建文字内容部分
      const textContent = outline.textElements?.map((el: any) => {
        if (el.type === 'title') return `📌 标题：${el.content}`
        if (el.type === 'subtitle') return `📍 副标题：${el.content}`
        if (el.type === 'point') return `• ${el.content}`
        if (el.type === 'decoration') return `✨ ${el.content}`
        return el.content
      }).join('\n') || outline.title

      const prompt = `创建一张小红书风格的${outline.position === 'Cover' ? '封面图' : outline.position === 'Ending' ? '结尾图' : '内容图'}，手绘插画风格。

## 📝 画面内容
**核心信息**: ${outline.coreMessage}

**文字内容**:
${textContent}

**视觉元素**: ${outline.visualElements?.join('、') || '与内容相关的元素'}

## 🎨 视觉概念
${outline.visualConcept || '展示文案内容，手绘风格'}

**引导钩子**: ${outline.swipeHook || ''}

## 🎯 视觉风格
- **配色**: ${selectedStyle.colorPalette}
- **元素**: ${selectedStyle.visualElements}
- **字体**: ${selectedStyle.typography}

## 📐 构图要求
- **图片方向**: 竖版 (Portrait)
- **图片比例**: ${ratio}
- **布局**: ${outline.layout || layout}（${selectedLayout.density}，${selectedLayout.whitespace}）
- **质量**: 高质量，细节丰富，专业级

## ⭐ 核心原则
- 手绘质感，禁止写实照片
- 信息简洁，突出关键词
- 大量留白，易于浏览
- 清晰的视觉层次
- 文字使用手写体风格
- 所有文字必须清晰可读`

      prompts.push(prompt)
    }
    
    console.log('✅ 提示词生成完成，共', prompts.length, '条')
    
    return NextResponse.json({
      success: true,
      prompts: prompts,
      analysis: analysisData,
      outline: outlineData,
    })
  } catch (error) {
    console.error('Failed to generate prompts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成提示词失败' },
      { status: 500 }
    )
  }
}

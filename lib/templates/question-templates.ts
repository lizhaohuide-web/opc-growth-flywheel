export interface QuestionField {
  id: string
  label: string          // 问题标题
  placeholder: string    // 占位提示
  type: 'textarea' | 'text' | 'select' | 'rating' | 'checklist'
  required: boolean
  options?: string[]     // select/checklist 的选项
  minLength?: number     // 最少字数
  maxLength?: number     // 最多字数
  tip?: string           // 填写指导
}

export interface QuestionTemplate {
  id: string
  name: string
  icon: string           // emoji 图标
  category: 'work' | 'learning' | 'life' | 'health' | 'growth' | 'creation'
  description: string
  methodology: string    // 方法论简介
  fields: QuestionField[]
  autoTags: string[]     // 自动添加的标签
  estimatedTime: string  // 预计耗时
}

export const questionTemplates: QuestionTemplate[] = [
  // 📊 工作类 (work)
  {
    id: 'kpt-work-review',
    name: 'KPT 工作复盘',
    icon: '🔄',
    category: 'work',
    description: 'Keep（保持）/ Problem（问题）/ Try（尝试）复盘法',
    methodology: '丰田生产方式中的持续改善工具',
    fields: [
      {
        id: 'keep',
        label: 'Keep（保持）',
        placeholder: '今天做得好、值得继续保持的做法...',
        type: 'textarea',
        required: true,
        minLength: 50,
        tip: '至少50字，描述今天表现好的方面'
      },
      {
        id: 'problem',
        label: 'Problem（问题）',
        placeholder: '今天遇到的问题或挑战...',
        type: 'textarea',
        required: true,
        minLength: 30,
        tip: '至少30字，描述遇到的问题或困难'
      },
      {
        id: 'try',
        label: 'Try（尝试）',
        placeholder: '明天想尝试的新方法...',
        type: 'textarea',
        required: true,
        minLength: 30,
        tip: '至少30字，描述未来想尝试的改进措施'
      },
      {
        id: 'mood',
        label: '今日心情',
        placeholder: '请选择今日心情',
        type: 'rating',
        required: false,
        tip: '1-5分评价今天的心情'
      },
      {
        id: 'priority',
        label: '明日优先级',
        placeholder: '请选择',
        type: 'checklist',
        required: false,
        options: ['紧急重要', '重要不紧急', '紧急不重要', '日常维护'],
        tip: '勾选明日需要关注的重要事项'
      }
    ],
    autoTags: ['工作', '复盘', '改进'],
    estimatedTime: '5分钟'
  },
  {
    id: 'star-event-recording',
    name: 'STAR 工作事件记录',
    icon: '⭐',
    category: 'work',
    description: 'Situation/Task/Action/Result 结构化事件记录',
    methodology: '行为面试法，用于结构化记录工作关键事件',
    fields: [
      {
        id: 'situation',
        label: '背景情境',
        placeholder: '描述当时的情况和背景...',
        type: 'textarea',
        required: true,
        tip: '详细描述事件发生的背景环境'
      },
      {
        id: 'task',
        label: '任务目标',
        placeholder: '需要完成的任务或目标...',
        type: 'text',
        required: true,
        tip: '明确当时的任务或目标是什么'
      },
      {
        id: 'action',
        label: '采取行动',
        placeholder: '你采取了哪些具体行动...',
        type: 'textarea',
        required: true,
        minLength: 100,
        tip: '至少100字，详细描述你的具体行动'
      },
      {
        id: 'result',
        label: '结果成效',
        placeholder: '最终的结果和成效...',
        type: 'textarea',
        required: true,
        tip: '描述最终取得的结果和成效'
      },
      {
        id: 'lesson',
        label: '经验教训',
        placeholder: '从这次经历中学到了什么...',
        type: 'textarea',
        required: false,
        tip: '总结经验和教训'
      }
    ],
    autoTags: ['工作', '事件', '记录', '成长'],
    estimatedTime: '8分钟'
  },
  // 📚 学习类 (learning)
  {
    id: 'cornell-upgrade-note',
    name: 'Cornell 学习笔记',
    icon: '📖',
    category: 'learning',
    description: '康奈尔大学学习系统，强调主动回忆和总结',
    methodology: '康奈尔大学学习系统，强调主动回忆和总结',
    fields: [
      {
        id: 'topic',
        label: '学习主题',
        placeholder: '本次学习的主题是什么？',
        type: 'text',
        required: true,
        tip: '简明扼要地描述学习的主题'
      },
      {
        id: 'concepts',
        label: '关键概念',
        placeholder: '列出关键概念和要点...',
        type: 'textarea',
        required: true,
        minLength: 100,
        tip: '至少100字，记录关键概念和要点'
      },
      {
        id: 'questions',
        label: '核心问题',
        placeholder: '列出3-5个核心问题...',
        type: 'textarea',
        required: false,
        tip: '提出3-5个与学习内容相关的核心问题'
      },
      {
        id: 'understanding',
        label: '个人理解',
        placeholder: '用自己的话复述...',
        type: 'textarea',
        required: true,
        minLength: 80,
        tip: '至少80字，用自己的话复述对内容的理解'
      },
      {
        id: 'practice',
        label: '实践计划',
        placeholder: '如何将知识应用到实际...',
        type: 'textarea',
        required: false,
        tip: '思考如何将所学知识应用到实践中'
      }
    ],
    autoTags: ['学习', '笔记', '总结', 'Cornell'],
    estimatedTime: '10分钟'
  },
  {
    id: 'feynman-learning',
    name: '费曼学习法',
    icon: '🧠',
    category: 'learning',
    description: '如果不能简单解释，说明没有真正理解',
    methodology: '如果你不能简单地解释一件事，说明你还没有真正理解它 —— 费曼',
    fields: [
      {
        id: 'concept',
        label: '我要学的概念',
        placeholder: '输入你想学习的概念...',
        type: 'text',
        required: true,
        tip: '明确你要学习的具体概念'
      },
      {
        id: 'simple-explanation',
        label: '用简单语言解释给小学生',
        placeholder: '用最简单的语言解释这个概念...',
        type: 'textarea',
        required: true,
        minLength: 150,
        tip: '至少150字，用最简单的语言解释'
      },
      {
        id: 'unclear-points',
        label: '哪些地方解释不清楚',
        placeholder: '指出你解释不清楚的地方...',
        type: 'textarea',
        required: true,
        tip: '诚实地指出还不理解的部分'
      },
      {
        id: 'supplement',
        label: '回到原始资料补充',
        placeholder: '回到原始资料补充知识...',
        type: 'textarea',
        required: false,
        tip: '补充之前解释不清的知识点'
      },
      {
        id: 'simplified-explanation',
        label: '再次简化解释',
        placeholder: '再次简化你的解释...',
        type: 'textarea',
        required: false,
        tip: '用更简洁的语言重新解释概念'
      }
    ],
    autoTags: ['学习', '费曼', '理解', '教学'],
    estimatedTime: '12分钟'
  },
  {
    id: 'deliberate-practice',
    name: '刻意练习记录',
    icon: '🎯',
    category: 'learning',
    description: '安德斯·艾利克森的刻意练习理论',
    methodology: '安德斯·艾利克森的刻意练习理论',
    fields: [
      {
        id: 'skill',
        label: '练习技能',
        placeholder: '本次练习的是什么技能？',
        type: 'text',
        required: true,
        tip: '明确本次练习的具体技能'
      },
      {
        id: 'goal',
        label: '今日目标',
        placeholder: '今天的目标是什么？',
        type: 'text',
        required: true,
        tip: '设定今天的具体练习目标'
      },
      {
        id: 'content',
        label: '练习内容',
        placeholder: '详细描述练习的内容...',
        type: 'textarea',
        required: true,
        tip: '详细记录练习的具体内容'
      },
      {
        id: 'difficulties',
        label: '困难点',
        placeholder: '练习中遇到的困难...',
        type: 'textarea',
        required: true,
        tip: '记录练习中遇到的主要困难'
      },
      {
        id: 'breakthrough',
        label: '突破点',
        placeholder: '今天有什么突破？',
        type: 'textarea',
        required: false,
        tip: '记录练习中的突破点'
      },
      {
        id: 'next-plan',
        label: '明日练习计划',
        placeholder: '明天的练习计划...',
        type: 'textarea',
        required: false,
        tip: '规划明天的练习内容'
      },
      {
        id: 'comfort-zone',
        label: '舒适区评估',
        placeholder: '评估舒适程度',
        type: 'rating',
        required: false,
        tip: '1=完全舒适区, 5=极度不适'
      }
    ],
    autoTags: ['学习', '练习', '刻意练习', '技能'],
    estimatedTime: '8分钟'
  },
  // 🌱 成长类 (growth)
  {
    id: 'orid-upgrade-reflection',
    name: 'ORID 焦点讨论',
    icon: '🔍',
    category: 'growth',
    description: '焦点讨论法，从事实到行动的系统性思考',
    methodology: '焦点讨论法，帮助从事实到行动的系统性思考',
    fields: [
      {
        id: 'objective',
        label: '客观事实',
        placeholder: '今天发生了什么？看到了什么？',
        type: 'textarea',
        required: true,
        tip: '客观描述发生的事情，不带主观判断'
      },
      {
        id: 'reflective',
        label: '感受反应',
        placeholder: '这让我有什么感受？',
        type: 'textarea',
        required: true,
        tip: '描述你的感受和情绪反应'
      },
      {
        id: 'interpretive',
        label: '意义诠释',
        placeholder: '这意味着什么？为什么重要？',
        type: 'textarea',
        required: true,
        tip: '分析事件的意义和重要性'
      },
      {
        id: 'decisional',
        label: '行动决定',
        placeholder: '我决定采取什么行动？',
        type: 'textarea',
        required: true,
        tip: '明确具体的行动计划'
      },
      {
        id: 'deadline',
        label: '行动期限',
        placeholder: '例：本周五前完成',
        type: 'text',
        required: false,
        tip: '设定行动完成的时间期限'
      }
    ],
    autoTags: ['反思', '成长', 'ORID', '行动'],
    estimatedTime: '10分钟'
  },
  {
    id: 'five-question-reflection',
    name: '每日 5 问反思',
    icon: '❓',
    category: 'growth',
    description: '本杰明·富兰克林日反思法改良版',
    methodology: '本杰明·富兰克林日反思法改良版',
    fields: [
      {
        id: 'valuable-thing',
        label: '今天最有价值的一件事',
        placeholder: '描述今天最有价值的事情...',
        type: 'textarea',
        required: true,
        tip: '思考今天最有价值的经历或收获'
      },
      {
        id: 'new-learning',
        label: '今天学到什么新东西',
        placeholder: '今天学到了什么？',
        type: 'textarea',
        required: true,
        tip: '记录今天学到的新知识或新见解'
      },
      {
        id: 'redo-today',
        label: '如果重来一天我会怎么做',
        placeholder: '如果重来，我会...',
        type: 'textarea',
        required: true,
        tip: '思考如何更好地利用这一天'
      },
      {
        id: 'help-others',
        label: '我帮助了谁/谁帮助了我',
        placeholder: '今天帮助他人或接受帮助的经历...',
        type: 'textarea',
        required: false,
        tip: '记录互助的经历'
      },
      {
        id: 'tomorrow-priority',
        label: '明天最重要的一件事',
        placeholder: '明天最重要的事情...',
        type: 'text',
        required: true,
        tip: '确定明天最重要的任务'
      }
    ],
    autoTags: ['反思', '成长', '每日', '学习'],
    estimatedTime: '7分钟'
  },
  {
    id: 'goal-progress-tracking',
    name: '目标进度追踪',
    icon: '📈',
    category: 'growth',
    description: 'OKR 目标管理 + 每周回顾',
    methodology: 'OKR 目标管理 + 每周回顾',
    fields: [
      {
        id: 'goal-name',
        label: '目标名称',
        placeholder: '输入目标名称...',
        type: 'text',
        required: true,
        tip: '明确你的目标是什么'
      },
      {
        id: 'current-stage',
        label: '当前阶段',
        placeholder: '请选择当前阶段',
        type: 'select',
        required: true,
        options: ['规划中', '进行中', '遇到瓶颈', '即将完成', '已完成'],
        tip: '选择目标当前所处的阶段'
      },
      {
        id: 'weekly-progress',
        label: '本周进展',
        placeholder: '本周取得了哪些进展...',
        type: 'textarea',
        required: true,
        tip: '描述本周在目标上的进展情况'
      },
      {
        id: 'obstacles',
        label: '遇到的障碍',
        placeholder: '遇到了哪些困难...',
        type: 'textarea',
        required: false,
        tip: '记录阻碍目标实现的障碍'
      },
      {
        id: 'next-milestone',
        label: '下一个里程碑',
        placeholder: '下一个里程碑是什么...',
        type: 'text',
        required: false,
        tip: '设定下一个阶段性目标'
      },
      {
        id: 'progress-rating',
        label: '完成度自评',
        placeholder: '请评分',
        type: 'rating',
        required: false,
        tip: '对目标完成度进行1-10分自评'
      },
      {
        id: 'resources-help',
        label: '需要的资源或帮助',
        placeholder: '需要哪些资源或帮助...',
        type: 'textarea',
        required: false,
        tip: '列出实现目标所需的资源或帮助'
      }
    ],
    autoTags: ['目标', '追踪', 'OKR', '进度'],
    estimatedTime: '8分钟'
  },
  // ❤️ 生活类 (life)
  {
    id: 'gratitude-journal',
    name: '感恩日记',
    icon: '🙏',
    category: 'life',
    description: '积极心理学之父塞利格曼的幸福 PERMA 模型',
    methodology: '积极心理学之父塞利格曼的幸福 PERMA 模型',
    fields: [
      {
        id: 'grateful-three-things',
        label: '今天感恩的3件事',
        placeholder: '具体描述今天感恩的3件事...',
        type: 'textarea',
        required: true,
        tip: '具体描述，不要泛泛而谈'
      },
      {
        id: 'grateful-person',
        label: '感恩的人',
        placeholder: '今天最想感谢的人...',
        type: 'text',
        required: false,
        tip: '记录你想要感谢的人'
      },
      {
        id: 'good-deed',
        label: '我为别人做了什么好事',
        placeholder: '今天我为别人做了什么...',
        type: 'textarea',
        required: false,
        tip: '记录你为他人做的好事'
      },
      {
        id: 'best-moment',
        label: '今天最美好的瞬间',
        placeholder: '描述今天最美好的时刻...',
        type: 'textarea',
        required: true,
        tip: '详细描述最美好的瞬间'
      },
      {
        id: 'today-summary',
        label: '一句话总结今天',
        placeholder: '用一句话总结今天...',
        type: 'text',
        required: true,
        tip: '简洁地总结今天'
      }
    ],
    autoTags: ['感恩', '日记', '积极心理', '幸福'],
    estimatedTime: '5分钟'
  },
  {
    id: 'emotion-log',
    name: '情绪日志',
    icon: '💭',
    category: 'life',
    description: '认知行为疗法 CBT 情绪管理框架',
    methodology: '认知行为疗法 CBT 情绪管理框架',
    fields: [
      {
        id: 'primary-emotion',
        label: '今天主要情绪',
        placeholder: '请选择主要情绪',
        type: 'select',
        required: true,
        options: ['开心', '平静', '焦虑', '沮丧', '愤怒', '兴奋', '疲惫', '感动'],
        tip: '选择今天最主要的情绪'
      },
      {
        id: 'intensity',
        label: '情绪强度',
        placeholder: '请评分',
        type: 'rating',
        required: true,
        tip: '1-5分评估情绪强度'
      },
      {
        id: 'triggering-event',
        label: '触发事件',
        placeholder: '是什么引发了这种情绪...',
        type: 'textarea',
        required: true,
        tip: '描述引发情绪的具体事件'
      },
      {
        id: 'physical-feelings',
        label: '身体感受',
        placeholder: '胸闷、肩膀紧张、呼吸急促...',
        type: 'textarea',
        required: false,
        tip: '例如：胸闷、肩膀紧张、呼吸急促'
      },
      {
        id: 'coping-methods',
        label: '我的应对方式',
        placeholder: '我是如何应对的...',
        type: 'textarea',
        required: true,
        tip: '描述你应对这种情绪的方式'
      },
      {
        id: 'message-from-emotion',
        label: '这种情绪想告诉我什么',
        placeholder: '这种情绪传递的信息...',
        type: 'textarea',
        required: false,
        tip: '思考情绪想要传达的信息'
      },
      {
        id: 'adjustment-tomorrow',
        label: '明天如何调整',
        placeholder: '明天如何调整自己的状态...',
        type: 'textarea',
        required: false,
        tip: '规划明天的情绪调节方式'
      }
    ],
    autoTags: ['情绪', '日志', 'CBT', '心理健康'],
    estimatedTime: '8分钟'
  },
  // 💪 健康类 (health)
  {
    id: 'daily-health-checkin',
    name: '每日健康打卡',
    icon: '💪',
    category: 'health',
    description: '量化自我(Quantified Self)健康追踪',
    methodology: '量化自我(Quantified Self)健康追踪',
    fields: [
      {
        id: 'sleep-duration',
        label: '睡眠时长',
        placeholder: '例：7.5小时',
        type: 'text',
        required: true,
        tip: '记录昨晚的睡眠时长'
      },
      {
        id: 'sleep-quality',
        label: '睡眠质量',
        placeholder: '请评分',
        type: 'rating',
        required: true,
        tip: '1-5分评估睡眠质量'
      },
      {
        id: 'exercise-content',
        label: '运动内容',
        placeholder: '类型、时长、强度...',
        type: 'textarea',
        required: false,
        tip: '记录运动的类型、时长和强度'
      },
      {
        id: 'diet-record',
        label: '饮食记录',
        placeholder: '早中晚三餐概要...',
        type: 'textarea',
        required: false,
        tip: '简要记录三餐饮食情况'
      },
      {
        id: 'water-intake',
        label: '饮水量',
        placeholder: '例：8杯',
        type: 'text',
        required: false,
        tip: '记录今天的饮水量'
      },
      {
        id: 'energy-level',
        label: '精力水平',
        placeholder: '请评分',
        type: 'rating',
        required: true,
        tip: '1-5分评估今日精力水平'
      },
      {
        id: 'health-reflection',
        label: '今日健康反思',
        placeholder: '对今天健康状况的反思...',
        type: 'textarea',
        required: false,
        tip: '反思今日健康相关情况'
      }
    ],
    autoTags: ['健康', '打卡', '量化自我', '生活习惯'],
    estimatedTime: '3分钟'
  },
  // ✍️ 创作类 (creation)
  {
    id: 'content-idea-recording',
    name: '内容创意记录',
    icon: '✨',
    category: 'creation',
    description: '内容创作 5W 框架',
    methodology: '内容创作 5W 框架',
    fields: [
      {
        id: 'idea-theme',
        label: '创意主题',
        placeholder: '本次创意的主题...',
        type: 'text',
        required: true,
        tip: '明确创意的核心主题'
      },
      {
        id: 'inspiration-source',
        label: '灵感来源',
        placeholder: '什么触发了这个想法？',
        type: 'textarea',
        required: true,
        tip: '什么触发了这个想法？'
      },
      {
        id: 'target-audience',
        label: '目标受众',
        placeholder: '这个内容给谁看？',
        type: 'text',
        required: false,
        tip: '明确内容的目标受众'
      },
      {
        id: 'core-point',
        label: '核心观点',
        placeholder: '核心观点是什么...',
        type: 'textarea',
        required: true,
        minLength: 50,
        tip: '至少50字，阐述核心观点'
      },
      {
        id: 'outline-structure',
        label: '大纲结构',
        placeholder: '列出3-5个要点...',
        type: 'textarea',
        required: false,
        tip: '列出3-5个要点'
      },
      {
        id: 'material-collection',
        label: '素材收集',
        placeholder: '相关的案例、数据、引用...',
        type: 'textarea',
        required: false,
        tip: '收集相关的案例、数据、引用'
      },
      {
        id: 'output-form',
        label: '预计产出形式',
        placeholder: '请选择产出形式',
        type: 'select',
        required: false,
        options: ['文章', '视频', '小红书', '播客', 'PPT', '其他'],
        tip: '选择内容的产出形式'
      }
    ],
    autoTags: ['创意', '内容', '写作', '策划'],
    estimatedTime: '10分钟'
  },
  {
    id: 'weekly-review',
    name: '每周复盘',
    icon: '📅',
    category: 'work' as const,
    description: '系统化回顾一周的工作与成长',
    methodology: '基于敏捷开发的 Sprint Review + 个人发展规划',
    fields: [
      { id: 'wins', label: '本周最大的 3 个成果', placeholder: '1. ...\n2. ...\n3. ...', type: 'textarea' as const, required: true, minLength: 50, tip: '具体描述你完成了什么，产生了什么价值' },
      { id: 'lessons', label: '本周学到的最重要一课', placeholder: '从一个具体事件中总结...', type: 'textarea' as const, required: true },
      { id: 'unfinished', label: '未完成的事项及原因', placeholder: '列出未完成的任务和卡住的原因', type: 'textarea' as const, required: false },
      { id: 'next-week', label: '下周最重要的 3 件事', placeholder: '1. ...\n2. ...\n3. ...', type: 'textarea' as const, required: true, tip: '聚焦最高价值的事项' },
      { id: 'energy', label: '本周精力状态', placeholder: '', type: 'rating' as const, required: true },
    ],
    autoTags: ['周复盘', '工作'],
    estimatedTime: '15分钟'
  },
  {
    id: 'reading-note',
    name: '读书笔记',
    icon: '📖',
    category: 'learning' as const,
    description: '结构化记录阅读收获，让读书不白读',
    methodology: '基于"主题阅读法" + "渐进式总结"理论',
    fields: [
      { id: 'book', label: '书名 / 文章标题', placeholder: '例：《原则》', type: 'text' as const, required: true },
      { id: 'author', label: '作者', placeholder: '', type: 'text' as const, required: false },
      { id: 'core-idea', label: '核心观点（一句话概括）', placeholder: '这本书/文章最重要的一个观点是什么？', type: 'textarea' as const, required: true, maxLength: 200 },
      { id: 'highlights', label: '精彩摘录（3-5 条）', placeholder: '摘抄触动你的原文段落...', type: 'textarea' as const, required: true, minLength: 50 },
      { id: 'thoughts', label: '我的思考与联想', placeholder: '这些内容让我联想到什么？与我的经验有什么关联？', type: 'textarea' as const, required: true, minLength: 80 },
      { id: 'action', label: '可以立刻行动的一件事', placeholder: '读完后我马上要做的事...', type: 'text' as const, required: true, tip: '好的读书笔记一定要有行动项' },
      { id: 'rating', label: '推荐指数', placeholder: '', type: 'rating' as const, required: true },
    ],
    autoTags: ['读书', '学习'],
    estimatedTime: '15分钟'
  },
  {
    id: 'decision-log',
    name: '决策日志',
    icon: '⚖️',
    category: 'growth' as const,
    description: '记录重要决策，未来回顾决策质量',
    methodology: '基于 Ray Dalio《原则》中的决策日志方法',
    fields: [
      { id: 'decision', label: '我做了什么决策？', placeholder: '清晰描述你的决策内容', type: 'textarea' as const, required: true },
      { id: 'context', label: '决策背景', placeholder: '当时面临什么情况？有哪些选项？', type: 'textarea' as const, required: true, minLength: 50 },
      { id: 'reasoning', label: '决策依据', placeholder: '我为什么选择这个方案？基于什么信息和逻辑？', type: 'textarea' as const, required: true, minLength: 80, tip: '写清楚推理过程，方便未来复盘' },
      { id: 'risks', label: '预期风险', placeholder: '最坏的情况是什么？我能承受吗？', type: 'textarea' as const, required: false },
      { id: 'expected', label: '预期结果', placeholder: '如果决策正确，预期会发生什么？', type: 'textarea' as const, required: true },
      { id: 'confidence', label: '决策信心度', placeholder: '', type: 'rating' as const, required: true, tip: '1=很不确定，5=非常确信' },
    ],
    autoTags: ['决策', '成长', '反思'],
    estimatedTime: '10分钟'
  },
  {
    id: 'meeting-note',
    name: '会议纪要',
    icon: '🤝',
    category: 'work' as const,
    description: '高效记录会议要点和行动项',
    methodology: '基于 Amazon 的会议备忘录文化',
    fields: [
      { id: 'topic', label: '会议主题', placeholder: '', type: 'text' as const, required: true },
      { id: 'participants', label: '参会人员', placeholder: '列出关键参会人', type: 'text' as const, required: false },
      { id: 'key-points', label: '关键讨论点', placeholder: '1. ...\n2. ...\n3. ...', type: 'textarea' as const, required: true, minLength: 50 },
      { id: 'decisions', label: '达成的决策', placeholder: '会上明确决定了什么？', type: 'textarea' as const, required: true },
      { id: 'actions', label: '行动项（谁/做什么/截止时间）', placeholder: '张三 - 完成XX报告 - 周五前\n李四 - 跟进XX客户 - 明天', type: 'textarea' as const, required: true, tip: '每个行动项都要有负责人和截止时间' },
      { id: 'follow-up', label: '下次会议时间/跟进事项', placeholder: '', type: 'text' as const, required: false },
    ],
    autoTags: ['会议', '工作'],
    estimatedTime: '8分钟'
  },
  {
    id: 'problem-solving',
    name: '问题解决记录',
    icon: '🔧',
    category: 'growth' as const,
    description: '结构化分析和解决问题，积累方法论',
    methodology: '基于丰田"5 Why"分析法 + PDCA 循环',
    fields: [
      { id: 'problem', label: '遇到了什么问题？', placeholder: '清晰描述问题现象', type: 'textarea' as const, required: true },
      { id: 'why', label: '根本原因分析（连问 5 个为什么）', placeholder: '为什么会出现这个问题？\n→ 因为...\n→ 为什么？因为...\n→ 为什么？因为...', type: 'textarea' as const, required: true, minLength: 80, tip: '层层追问，找到根本原因而非表面原因' },
      { id: 'solution', label: '我的解决方案', placeholder: '具体怎么解决的？', type: 'textarea' as const, required: true },
      { id: 'result', label: '结果如何？', placeholder: '问题解决了吗？效果怎么样？', type: 'textarea' as const, required: true },
      { id: 'prevention', label: '如何预防再次发生？', placeholder: '可以建立什么机制或习惯来避免？', type: 'textarea' as const, required: false, tip: '好的问题解决不只是修复，更是预防' },
    ],
    autoTags: ['问题解决', '成长', '方法论'],
    estimatedTime: '10分钟'
  },
  {
    id: 'habit-tracker',
    name: '习惯养成打卡',
    icon: '🎯',
    category: 'health' as const,
    description: '追踪习惯执行情况，用数据驱动改变',
    methodology: '基于 James Clear《原子习惯》的习惯追踪系统',
    fields: [
      { id: 'habits', label: '今日习惯完成情况', placeholder: '', type: 'checklist' as const, required: true, options: ['早起(7点前)', '运动30分钟', '阅读30分钟', '写作/记录', '冥想/正念', '健康饮食', '早睡(11点前)', '喝水8杯'] },
      { id: 'highlight', label: '今天最棒的一个习惯执行', placeholder: '哪个习惯执行得最好？为什么？', type: 'textarea' as const, required: true },
      { id: 'struggle', label: '最难坚持的是什么？', placeholder: '哪个习惯差点放弃？什么阻碍了你？', type: 'textarea' as const, required: false },
      { id: 'tomorrow', label: '明天的微调计划', placeholder: '基于今天的执行情况，明天做什么小调整？', type: 'textarea' as const, required: false, tip: '不要大改，每天只做1%的微调' },
      { id: 'streak', label: '当前连续天数', placeholder: '例：第15天', type: 'text' as const, required: false },
    ],
    autoTags: ['习惯', '健康', '自律'],
    estimatedTime: '5分钟'
  }
]

export function getTemplatesByCategory(category: string) {
  return questionTemplates.filter(t => t.category === category)
}

export function getTemplateById(id: string) {
  return questionTemplates.find(t => t.id === id)
}

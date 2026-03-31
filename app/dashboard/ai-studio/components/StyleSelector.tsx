'use client'

interface StyleOption {
  id: string
  name: string
  description: string
  icon: string
}

interface StyleSelectorProps {
  selectedStyle?: string
  onSelectStyle: (styleId: string) => void
  platform?: 'wechat' | 'xiaohongshu' | 'moments' | 'short-video' | 'podcast'
}

const styleOptions: Record<string, StyleOption[]> = {
  wechat: [
    { id: 'professional', name: '专业深度', description: '权威、专业、有深度', icon: '💼' },
    { id: 'warm', name: '温暖治愈', description: '亲切、温暖、有共鸣', icon: '🌟' },
    { id: 'tech', name: '科技感', description: '前沿、创新、未来感', icon: '🚀' },
  ],
  xiaohongshu: [
    { id: 'lifestyle', name: '生活方式', description: '精致、优雅、有品位', icon: '✨' },
    { id: 'tutorial', name: '教程干货', description: '实用、详细、易上手', icon: '📚' },
    { id: 'story', name: '故事分享', description: '真实、感人、有温度', icon: '📖' },
  ],
  moments: [
    { id: 'casual', name: '生活化', description: '自然、随性、接地气', icon: '☕' },
    { id: 'thoughtful', name: '感悟型', description: '思考、深度、有启发', icon: '💭' },
    { id: 'fun', name: '幽默风趣', description: '有趣、轻松、会心一笑', icon: '😄' },
  ],
  'short-video': [
    { id: 'dramatic', name: '戏剧化', description: '冲突、悬念、吸引眼球', icon: '🎭' },
    { id: 'educational', name: '知识型', description: '干货、易懂、有价值', icon: '🎓' },
    { id: 'entertaining', name: '娱乐性', description: '有趣、轻松、易传播', icon: '🎉' },
  ],
  podcast: [
    { id: 'conversational', name: '对话式', description: '自然、流畅、像聊天', icon: '💬' },
    { id: 'interview', name: '访谈式', description: '问答、深入、有洞察', icon: '🎙️' },
    { id: 'narrative', name: '叙事式', description: '故事、情节、有画面', icon: '📻' },
  ],
}

export default function StyleSelector({ selectedStyle, onSelectStyle, platform = 'wechat' }: StyleSelectorProps) {
  const options = styleOptions[platform] || styleOptions.wechat

  return (
    <div>
      <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
        选择风格
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map(option => {
          const isSelected = selectedStyle === option.id
          
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectStyle(option.id)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
              }}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {option.name}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {option.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

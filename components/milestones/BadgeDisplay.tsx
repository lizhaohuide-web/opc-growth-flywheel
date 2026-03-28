'use client'
import { useState } from 'react'

interface Badge {
  id: string
  name: string
  category: string
  icon: string
  description: string
  achieved: boolean
  progress?: number
  target?: number
  earnedAt?: string
}

interface Props {
  badges: Badge[]
}

const categories = [
  { id: 'all', name: '全部', icon: '🏅' },
  { id: 'writing', name: '写作成就', icon: '📝' },
  { id: 'thinking', name: '深度思考', icon: '🧠' },
  { id: 'growth', name: '成长达人', icon: '🎯' },
  { id: 'content', name: '内容变现', icon: '📱' },
  { id: 'special', name: '特殊成就', icon: '🏆' }
]

export default function BadgeDisplay({ badges }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory)
  
  const categoryCounts = {
    all: badges.length,
    writing: badges.filter(b => b.category === 'writing').length,
    thinking: badges.filter(b => b.category === 'thinking').length,
    growth: badges.filter(b => b.category === 'growth').length,
    content: badges.filter(b => b.category === 'content').length,
    special: badges.filter(b => b.category === 'special').length
  }
  
  return (
    <div>
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors ${
              selectedCategory === category.id
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-accent)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            <span>{category.icon}</span>
            {category.name}
            <span className="bg-[var(--bg-elevated)] text-[var(--text-primary)] text-[10px] px-1.5 py-0.5 rounded-full">
              {categoryCounts[category.id as keyof typeof categoryCounts]}
            </span>
          </button>
        ))}
      </div>
      
      {/* 徽章网格 - 更紧凑 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filteredBadges.map(badge => (
          <div
            key={badge.id}
            className={`relative p-3 rounded-xl border text-center transition-all duration-300 hover:scale-105 cursor-pointer group ${
              badge.achieved
                ? 'bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] border-[var(--border-accent)] shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
                : 'bg-[var(--bg-card)] border-[var(--border-subtle)] opacity-60'
            }`}
          >
            {/* 徽章图标 - 更大更清晰 */}
            <div className={`text-3xl mb-1.5 ${
              badge.achieved ? '' : 'grayscale'
            }`}>
              {badge.achieved ? badge.icon : '🔒'}
            </div>
            
            {/* 徽章名称 */}
            <div className={`font-semibold text-xs mb-0.5 truncate ${
              badge.achieved ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            }`}>
              {badge.name}
            </div>
            
            {/* 徽章描述 - hover 显示 */}
            <div className="text-[10px] text-[var(--text-secondary)] hidden group-hover:block absolute inset-0 bg-[var(--bg-card-hover)] rounded-xl p-2 flex items-center justify-center z-10">
              {badge.description}
            </div>
            
            {/* 进度或获得状态 */}
            {!badge.achieved && badge.progress !== undefined && badge.target ? (
              <div className="mt-1">
                <div className="w-full bg-[var(--bg-elevated)] rounded-full h-1 mb-0.5">
                  <div 
                    className="bg-[var(--accent)] h-1 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (badge.progress / badge.target) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)]">
                  {badge.progress}/{badge.target}
                </div>
              </div>
            ) : badge.achieved ? (
              <div className="text-[10px] text-[var(--success)] mt-1">
                ✓
              </div>
            ) : (
              <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                未解锁
              </div>
            )}
            
            {/* 成就光晕 */}
            {badge.achieved && (
              <div className="absolute inset-0 rounded-xl pointer-events-none animate-shine bg-[linear-gradient(110deg,#00000000,45%,#ffffff10,55%,#00000000)] opacity-30"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* 统计信息 */}
      <div className="mt-4 pt-3 border-t text-xs flex justify-between" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
        <span>总计：{badges.length}</span>
        <span>已获得：{badges.filter(b => b.achieved).length}</span>
        <span>完成度：{Math.round((badges.filter(b => b.achieved).length / badges.length) * 100)}%</span>
      </div>
    </div>
  )
}

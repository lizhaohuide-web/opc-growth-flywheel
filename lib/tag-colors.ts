// 标签类别 → 颜色映射
const TAG_CATEGORIES: Record<string, { bg: string; text: string; border: string }> = {
  // 学习类
  '学习': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '读书': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '技能': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  // 商业类
  '商业': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  '创业': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  '营销': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '变现': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  // 生活类
  '生活': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  '健康': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '运动': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  // 情绪类
  '感悟': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '反思': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  '感恩': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  // 创作类
  '创作': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  '写作': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  // 社交类
  '社交': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  '人脉': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
}

// 默认颜色（匹配不到时）
const DEFAULT_COLOR = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }

// 基于哈希的彩虹色（保证同一标签颜色一致）
const RAINBOW = [
  { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
]

export function getTagColor(tag: string) {
  // 优先匹配预定义类别
  if (TAG_CATEGORIES[tag]) return TAG_CATEGORIES[tag]
  // 否则基于哈希分配彩虹色
  const hash = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return RAINBOW[hash % RAINBOW.length]
}
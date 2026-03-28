'use client'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

interface Props {
  data: Array<{ subject: string; score: number; fullMark?: number }>
}

export default function GrowthRadarChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 10]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
          />
          <Radar
            name="得分"
            dataKey="score"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

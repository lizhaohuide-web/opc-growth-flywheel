'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  noteId: string;
  initialScore?: number | null;
}

export default function QualityScoreBadge({ noteId, initialScore }: Props) {
  const [score, setScore] = useState<number | null>(initialScore ?? null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const calculateScore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/score`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setScore(data.score);
    } catch (error) {
      console.error('计算笔记质量分数失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setScore(initialScore ?? null);
  }, [initialScore]);

  if (score === null) {
    return (
      <button
        onClick={calculateScore}
        disabled={loading}
        className="text-xs font-medium rounded-full w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        }}
        title="点击计算质量分数"
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <span>?</span>
        )}
      </button>
    );
  }

  let bgColor = 'var(--text-tertiary)';
  if (score >= 8) bgColor = 'var(--success)';
  else if (score >= 6) bgColor = 'var(--info)';
  else if (score >= 4) bgColor = 'var(--warning)';
  else bgColor = 'var(--error)';

  return (
    <div
      className="text-xs font-bold rounded-full w-10 h-10 flex items-center justify-center"
      style={{ background: bgColor, color: '#fff' }}
      title={`质量分数：${score}`}
    >
      {score}
    </div>
  );
}

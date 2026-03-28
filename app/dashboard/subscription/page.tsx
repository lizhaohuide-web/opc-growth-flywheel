'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PLANS, FEATURE_LIMITS } from '@/lib/subscription';

export default function SubscriptionPage() {
  const [userStatus, setUserStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  useEffect(() => {
    fetchUserStatus();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const res = await fetch('/api/subscription/status');
      const data = await res.json();
      setUserStatus(data);
    } catch (error) {
      console.error('获取订阅状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      setRedeemError('请输入兑换码');
      return;
    }

    setRedeeming(true);
    setRedeemError('');

    try {
      const res = await fetch('/api/subscription/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setRedeemSuccess(true);
        setRedeemCode('');
        fetchUserStatus();
        setTimeout(() => setRedeemSuccess(false), 3000);
      } else {
        setRedeemError(data.error || '兑换失败');
      }
    } catch (error) {
      setRedeemError('网络错误，请稍后再试');
    } finally {
      setRedeeming(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      const res = await fetch('/api/subscription/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('试用已开启！');
        fetchUserStatus();
      } else {
        alert(data.error || '开启试用失败');
      }
    } catch (error) {
      alert('网络错误，请稍后再试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12" style={{ borderBottom: '2px solid var(--accent)' }}></div>
      </div>
    );
  }

  if (!userStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }}>加载失败</p>
      </div>
    );
  }

  const { plan, daysRemaining, endDate, features, isActive, trialUsed } = userStatus;
  const currentPlanInfo = PLANS[plan as keyof typeof PLANS] || PLANS.trial;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-enter">
      <h1 className="text-3xl font-display mb-8" style={{ color: 'var(--text-primary)' }}>会员订阅</h1>

      {/* 当前订阅状态卡片 */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-display mb-4" style={{ color: 'var(--text-primary)' }}>当前订阅状态</h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={
                  plan === 'trial'
                    ? { background: 'rgba(96,165,250,0.15)', color: 'var(--info)' }
                    : plan === 'monthly'
                    ? { background: 'rgba(168,85,247,0.15)', color: 'var(--accent)' }
                    : plan === 'yearly'
                    ? { background: 'rgba(52,211,153,0.15)', color: 'var(--success)' }
                    : { background: 'rgba(251,191,36,0.15)', color: 'var(--warning)' }
                }
              >
                {currentPlanInfo.name}
              </span>
              {plan === 'trial' && !isActive && (
                <span className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--error)' }}>
                  已过期
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              {endDate 
                ? `到期时间：${new Date(endDate).toLocaleDateString('zh-CN')} (${daysRemaining} 天后到期)` 
                : '永久有效'}
            </p>
          </div>
          
          {plan === 'trial' && isActive && (
            <div className="w-full md:w-64">
              <div className="w-full rounded-full h-2.5" style={{ background: 'var(--bg-elevated)' }}>
                <div 
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(100, (1 - daysRemaining / 7) * 100)}%`,
                    background: 'var(--accent)',
                  }}
                ></div>
              </div>
              <p className="text-right text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{daysRemaining}/7 天</p>
            </div>
          )}
        </div>
      </div>

      {/* 定价卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 免费试用卡片 */}
        <div
          className="card p-6 transition-all"
          style={{
            border: plan === 'trial' ? '2px solid var(--info)' : '2px solid var(--border-subtle)',
          }}
        >
          <h3 className="text-xl font-display mb-2" style={{ color: 'var(--text-primary)' }}>免费试用</h3>
          <div className="text-3xl font-body mb-1" style={{ color: 'var(--text-primary)' }}>¥0</div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>7 天全功能体验</p>
          
          <ul className="space-y-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> 20 篇笔记</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> AI 智能摘要</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> AI 内容生成（5 次/天）</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> 周报</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> 18 个笔记模板</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--text-tertiary)' }}>✗</span> <span style={{ color: 'var(--text-tertiary)' }}>月报</span></li>
          </ul>

          {plan === 'trial' && isActive ? (
            <button disabled className="w-full py-3 px-4 rounded-lg font-medium cursor-not-allowed"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>当前计划</button>
          ) : !trialUsed ? (
            <button onClick={handleStartTrial}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>开始试用</button>
          ) : (
            <button disabled className="w-full py-3 px-4 rounded-lg font-medium cursor-not-allowed"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>试用已用完</button>
          )}
        </div>

        {/* 月度会员卡片 */}
        <div
          className="card p-6 transition-all"
          style={{
            border: plan === 'monthly' ? '2px solid var(--accent)' : '2px solid var(--border-subtle)',
          }}
        >
          <h3 className="text-xl font-display mb-2" style={{ color: 'var(--text-primary)' }}>月度会员</h3>
          <div className="text-3xl font-body mb-1" style={{ color: 'var(--text-primary)' }}>¥79<span className="text-lg font-normal" style={{ color: 'var(--text-tertiary)' }}>/月</span></div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>全功能无限制</p>
          
          <ul className="space-y-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> <strong>无限</strong>笔记</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> AI 智能摘要</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> AI 内容生成（<strong>无限</strong>）</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> 周报</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> 月报</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> 成长雷达图 AI 评估</li>
          </ul>

          {plan === 'monthly' && isActive ? (
            <button disabled className="w-full py-3 px-4 rounded-lg font-medium cursor-not-allowed"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>当前计划</button>
          ) : (
            <button
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >立即订阅</button>
          )}
        </div>

        {/* 年度会员卡片 */}
        <div
          className="relative card p-6 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(245,158,11,0.05) 100%)',
            border: '2px solid var(--border-accent)',
          }}
        >
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: 'linear-gradient(90deg, var(--warning) 0%, var(--accent) 100%)',
                color: '#fff',
              }}
            >最受欢迎</span>
          </div>
          <h3 className="text-xl font-display mb-2 pt-3" style={{ color: 'var(--text-primary)' }}>年度会员</h3>
          <div className="text-3xl font-body mb-1" style={{ color: 'var(--text-primary)' }}>¥399<span className="text-lg font-normal" style={{ color: 'var(--text-tertiary)' }}>/年</span></div>
          <p className="text-sm mb-4" style={{ color: 'var(--success)' }}>≈¥33/月，省 ¥549</p>
          
          <ul className="space-y-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> <strong>无限</strong>笔记</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> AI 智能摘要</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> AI 内容生成（<strong>无限</strong>）</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> 周报 + 月报</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> 成长雷达图 AI 评估</li>
            <li className="flex items-center gap-2"><span style={{ color: 'var(--success)' }}>✓</span> <strong>优先</strong>新功能体验</li>
          </ul>

          {plan === 'yearly' && isActive ? (
            <button disabled
              className="w-full py-3 px-4 rounded-lg font-medium cursor-not-allowed"
              style={{
                background: 'linear-gradient(90deg, var(--warning) 0%, var(--accent) 100%)',
                color: '#fff',
              }}
            >当前计划</button>
          ) : (
            <button
              className="w-full py-3 px-4 rounded-lg font-medium transition-all"
              style={{
                background: 'linear-gradient(90deg, var(--warning) 0%, var(--accent) 100%)',
                color: '#fff',
              }}
            >立即订阅</button>
          )}
        </div>
      </div>

      {/* 兑换码区域 */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-display mb-4" style={{ color: 'var(--text-primary)' }}>兑换会员</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="请输入兑换码"
            className="flex-grow px-4 py-3 rounded-lg focus:outline-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
            onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={redeeming 
              ? { background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }
              : { background: 'var(--accent)', color: '#fff' }
            }
          >
            {redeeming ? '兑换中...' : '兑换'}
          </button>
        </div>
        
        {redeemSuccess && (
          <div className="mt-4 p-3 rounded-lg flex items-center"
            style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--success)' }}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            兑换成功！
          </div>
        )}
        
        {redeemError && (
          <div className="mt-4 p-3 rounded-lg flex items-center"
            style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--error)' }}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {redeemError}
          </div>
        )}
      </div>
    </div>
  );
}

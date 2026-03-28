import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLANS, FEATURE_LIMITS, getDaysRemaining, isPlanActive } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 获取用户会话
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: '未登录用户' }, { status: 401 });
    }

    // 查询用户订阅信息
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_start, subscription_end, trial_used')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('获取用户订阅信息失败:', error);
      return Response.json({ error: '获取订阅信息失败' }, { status: 500 });
    }

    let { subscription_plan, subscription_start, subscription_end, trial_used } = profile || {};
    
    // 如果没有订阅记录，默认为试用且未使用过试用
    if (!subscription_plan) {
      subscription_plan = 'trial';
    }
    
    // 检查是否过期，如果过期则更新数据库
    const isExpired = subscription_end ? new Date(subscription_end) <= new Date() : false;
    
    if (isExpired && subscription_plan !== 'expired') {
      // 更新订阅状态为过期
      await supabase
        .from('profiles')
        .update({ subscription_plan: 'expired' })
        .eq('id', user.id);
      
      subscription_plan = 'expired';
    }
    
    // 对于新用户，如果没有使用过试用且当前计划是试用，则开启7天试用
    if (subscription_plan === 'trial' && !trial_used) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      await supabase
        .from('profiles')
        .update({ 
          subscription_start: new Date().toISOString(),
          subscription_end: trialEndDate.toISOString(),
          trial_used: true
        })
        .eq('id', user.id);
      
      subscription_start = new Date().toISOString();
      subscription_end = trialEndDate.toISOString();
    }
    
    const daysRemaining = getDaysRemaining(subscription_end);
    const isActive = isPlanActive(subscription_plan as any, subscription_end);
    const features = FEATURE_LIMITS[subscription_plan];
    
    return Response.json({
      plan: subscription_plan,
      startDate: subscription_start,
      endDate: subscription_end,
      daysRemaining,
      features,
      isActive,
      trialUsed: trial_used
    });
  } catch (error) {
    console.error('获取订阅状态错误:', error);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
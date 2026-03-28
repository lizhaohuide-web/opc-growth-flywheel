import { createClient } from '@/lib/supabase/server';
import { FEATURE_LIMITS } from './index';

// 在需要限制的 API 中使用
export async function checkFeature(userId: string, feature: string): Promise<{ allowed: boolean; message?: string }> {
  // 导入 Supabase 客户端
  const supabase = createClient();

  // 查询用户订阅状态
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_plan, subscription_end')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return { allowed: false, message: '无法获取用户订阅信息' };
  }

  const { subscription_plan, subscription_end } = profile;
  
  // 检查是否过期
  const planIsActive = subscription_end ? new Date(subscription_end) > new Date() : false;
  
  // 如果已过期但数据库中还未更新，则更新为 expired
  if (!planIsActive && subscription_plan !== 'expired') {
    await supabase
      .from('profiles')
      .update({ subscription_plan: 'expired' })
      .eq('id', userId);
    
    return { allowed: false, message: '订阅已过期，请续费' };
  }

  const planLimits = FEATURE_LIMITS[subscription_plan];

  if (!planLimits) {
    return { allowed: false, message: '无效的订阅计划' };
  }

  // 检查具体功能权限
  const allowed = planLimits[feature];
  
  if (typeof allowed === 'number') {
    // 如果是数字类型，表示有次数限制
    if (allowed === 0) {
      return { allowed: false, message: `此功能需要订阅会员` };
    }
    
    // 这里可以添加每日使用次数检查的逻辑
    // 对于 aiGenerate 这类有限制的功能，需要查询当日使用次数
    if (feature === 'aiGenerate') {
      // 示例：检查当日 AI 生成次数
      // 实际实现需要根据项目需求来统计
    }
    
    return { allowed: true };
  } else if (typeof allowed === 'boolean') {
    // 如果是布尔类型，直接返回权限状态
    return { allowed, message: allowed ? undefined : `此功能需要 ${subscription_plan === 'expired' ? '续费' : '订阅'} 会员` };
  }

  return { allowed: false, message: '未知功能权限' };
}
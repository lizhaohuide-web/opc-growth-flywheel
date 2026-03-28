// @ts-nocheck
import { createClient } from '@/lib/supabase/server';

/**
 * 为新用户设置试用期
 * 此函数应在用户注册成功后调用
 */
export async function setupTrialForNewUser(userId: string) {
  const supabase = await createClient();

  try {
    // 检查用户是否已有订阅记录
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('trial_used')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('获取用户资料失败:', error);
      return { success: false, error: '获取用户信息失败' };
    }

    // 如果用户还没有使用过试用，则为其设置7天试用期
    if (!profile || !profile.trial_used) {
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'trial',
          subscription_start: trialStartDate.toISOString(),
          subscription_end: trialEndDate.toISOString(),
          trial_used: true
        })
        .eq('id', userId);

      if (updateError) {
        console.error('设置试用期失败:', updateError);
        return { success: false, error: '设置试用期失败' };
      }

      // 记录到订阅历史
      const { error: historyError } = await supabase
        .from('subscription_history')
        .insert({
          user_id: userId,
          action: 'trial_start',
          plan: 'trial',
          amount: 0
        });

      if (historyError) {
        console.error('记录订阅历史失败:', historyError);
        // 这个错误不是致命的，可以继续
      }

      return { 
        success: true, 
        message: '试用期已自动开启，7天内可享受全部功能！',
        expiresAt: trialEndDate.toISOString()
      };
    } else {
      return { 
        success: false, 
        error: '该用户已使用过试用期' 
      };
    }
  } catch (error) {
    console.error('设置试用期时发生错误:', error);
    return { success: false, error: '内部错误' };
  }
}
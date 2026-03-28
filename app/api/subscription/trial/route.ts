import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 获取用户会话
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: '未登录用户' }, { status: 401 });
    }

    // 检查用户是否已用过试用
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trial_used')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('获取用户资料失败:', profileError);
      return Response.json({ error: '获取用户信息失败' }, { status: 500 });
    }

    if (profile?.trial_used) {
      return Response.json({ error: '试用机会已用完' }, { status: 400 });
    }

    // 设置 7 天试用期
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
      .eq('id', user.id);

    if (updateError) {
      console.error('更新用户订阅信息失败:', updateError);
      return Response.json({ error: '开启试用失败' }, { status: 500 });
    }

    // 记录到订阅历史
    const { error: historyError } = await supabase
      .from('subscription_history')
      .insert({
        user_id: user.id,
        action: 'trial_start',
        plan: 'trial',
        amount: 0
      });

    if (historyError) {
      console.error('记录订阅历史失败:', historyError);
      // 这个错误不是致命的，可以继续
    }

    return Response.json({
      success: true,
      plan: 'trial',
      expiresAt: trialEndDate.toISOString(),
      message: '试用已开启，7天内可享受全部功能！'
    });
  } catch (error) {
    console.error('开启试用错误:', error);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
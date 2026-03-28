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

    const { code } = await request.json();
    
    if (!code) {
      return Response.json({ error: '请输入兑换码' }, { status: 400 });
    }

    // 验证兑换码是否存在、未使用、有效
    const { data: redeemCode, error: codeError } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .is('used_at', null)
      .single();

    if (codeError || !redeemCode) {
      return Response.json({ error: '兑换码无效或已被使用' }, { status: 400 });
    }

    // 开启事务更新用户订阅信息
    const current = new Date();
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + redeemCode.duration_days);

    // 更新用户订阅信息
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_plan: redeemCode.plan,
        subscription_start: current.toISOString(),
        subscription_end: newEndDate.toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('更新用户订阅信息失败:', updateError);
      return Response.json({ error: '更新订阅信息失败' }, { status: 500 });
    }

    // 标记兑换码已使用
    const { error: markUsedError } = await supabase
      .from('redeem_codes')
      .update({
        used_at: current.toISOString(),
        used_by: user.id
      })
      .eq('id', redeemCode.id);

    if (markUsedError) {
      console.error('标记兑换码已使用失败:', markUsedError);
      return Response.json({ error: '处理兑换码失败' }, { status: 500 });
    }

    // 记录到订阅历史
    const { error: historyError } = await supabase
      .from('subscription_history')
      .insert({
        user_id: user.id,
        action: 'redeem',
        plan: redeemCode.plan,
        amount: 0, // 兑换码金额为0
        redeem_code: code
      });

    if (historyError) {
      console.error('记录订阅历史失败:', historyError);
      // 这个错误不是致命的，可以继续
    }

    return Response.json({
      success: true,
      plan: redeemCode.plan,
      expiresAt: newEndDate.toISOString(),
      message: '兑换成功！'
    });
  } catch (error) {
    console.error('兑换码处理错误:', error);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
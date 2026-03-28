import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 管理员用户ID（硬编码，后续应改为更安全的方式）
// 注意：这只是一个临时解决方案，生产环境中应使用更安全的认证机制
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 获取用户会话
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !ADMIN_USER_IDS.includes(user.id)) {
      return Response.json({ error: '权限不足' }, { status: 403 });
    }

    // 获取所有兑换码列表
    const { data: redeemCodes, error } = await supabase
      .from('redeem_codes')
      .select(`
        *,
        used_by_user:profiles!used_by(username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取兑换码列表失败:', error);
      return Response.json({ error: '获取兑换码列表失败' }, { status: 500 });
    }

    return Response.json({ success: true, data: redeemCodes });
  } catch (error) {
    console.error('获取兑换码列表错误:', error);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 获取用户会话
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !ADMIN_USER_IDS.includes(user.id)) {
      return Response.json({ error: '权限不足' }, { status: 403 });
    }

    const { count, plan, duration_days } = await request.json();
    
    if (!count || !plan || !duration_days) {
      return Response.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(plan)) {
      return Response.json({ error: '无效的计划类型' }, { status: 400 });
    }

    if (![30, 365].includes(duration_days)) {
      return Response.json({ error: '无效的天数' }, { status: 400 });
    }

    // 生成兑换码
    const codes = [];
    for (let i = 0; i < count; i++) {
      // 生成随机兑换码 (8位大写字母+数字)
      let code = '';
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'; // 排除易混淆字符
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      codes.push({
        code,
        plan,
        duration_days
      });
    }

    // 批量插入数据库
    const { error } = await supabase
      .from('redeem_codes')
      .insert(codes);

    if (error) {
      console.error('创建兑换码失败:', error);
      return Response.json({ error: '创建兑换码失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      codes: codes.map(c => c.code),
      message: `${count} 个兑换码创建成功`
    });
  } catch (error) {
    console.error('创建兑换码错误:', error);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
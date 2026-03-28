-- 订阅计划
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'trial';
-- trial | monthly | yearly | expired
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false;

-- 兑换码表
CREATE TABLE IF NOT EXISTS redeem_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  plan text NOT NULL, -- monthly | yearly
  duration_days integer NOT NULL, -- 30 或 365
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- 订阅历史
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL, -- 'trial_start' | 'subscribe' | 'renew' | 'redeem' | 'expire'
  plan text NOT NULL,
  amount integer, -- 分为单位，兑换码为0
  redeem_code text,
  created_at timestamptz DEFAULT now()
);
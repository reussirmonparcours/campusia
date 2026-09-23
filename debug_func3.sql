DO $$
DECLARE
  p_user_id uuid;
  p_provider_event_id text := 'debug_sale_1';
  p_plan_code text := 'ESSENTIAL';
  p_amount numeric := 2500;
  p_currency text := 'XOF';
  p_billing_interval public.billing_interval := 'monthly';
  p_metadata jsonb := '{}'::jsonb;
  
  v_plan_id uuid;
  v_sub_id uuid;
  v_old_sub record;
  v_payment_event record;
  v_base_date timestamptz;
  v_end_date timestamptz;
BEGIN
  SELECT id INTO p_user_id FROM auth.users LIMIT 1;
  
  -- Create first sub manually to ensure it exists
  SELECT id INTO v_plan_id FROM public.billing_plans WHERE code = p_plan_code LIMIT 1;
  INSERT INTO public.billing_subscriptions (
    user_id, plan_id, status, billing_interval, current_period_start, current_period_end
  ) VALUES (
    p_user_id, v_plan_id, 'active', p_billing_interval, now(), now() + interval '1 month'
  );

  -- 4. Calculate Subscription Dates deterministically
  v_base_date := now();
  
  -- Check for existing active or queued paid subscription to extend from its end date
  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan_id != (SELECT id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1) 
  ORDER BY current_period_end DESC NULLS LAST
  FOR UPDATE
  LIMIT 1;

  RAISE NOTICE 'v_old_sub.id = %', v_old_sub.id;
  RAISE NOTICE 'v_old_sub.end = %', v_old_sub.current_period_end;
  RAISE NOTICE 'now() = %', now();
  
  IF v_old_sub IS NOT NULL AND v_old_sub.current_period_end > now() THEN
    v_base_date := v_old_sub.current_period_end;
    RAISE NOTICE 'IF was TRUE! v_base_date = %', v_base_date;
  ELSE
    RAISE NOTICE 'IF was FALSE! v_old_sub IS NOT NULL: %, current_period_end > now(): %', (v_old_sub IS NOT NULL), (v_old_sub.current_period_end > now());
  END IF;

  RAISE EXCEPTION 'Debug finished';
END;
$$;

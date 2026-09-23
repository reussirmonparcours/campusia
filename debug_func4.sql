CREATE OR REPLACE FUNCTION public.debug_chariow4()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  p_user_id uuid;
  v_plan_id uuid;
  v_old_sub record;
  v_base_date timestamptz;
  v_debug jsonb;
BEGIN
  SELECT id INTO p_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_plan_id FROM public.billing_plans WHERE code = 'ESSENTIAL' LIMIT 1;
  
  -- Insert dummy subscription
  INSERT INTO public.billing_subscriptions (
    user_id, plan_id, status, billing_interval, current_period_start, current_period_end
  ) VALUES (
    p_user_id, v_plan_id, 'active', 'monthly', now(), now() + interval '1 month'
  );

  v_base_date := now();

  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan_id != (SELECT id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1) 
  ORDER BY current_period_end DESC NULLS LAST
  FOR UPDATE
  LIMIT 1;

  v_debug := jsonb_build_object(
    'v_old_sub_id', v_old_sub.id,
    'v_old_sub_end', v_old_sub.current_period_end,
    'now', now(),
    'is_not_null', (v_old_sub IS NOT NULL),
    'is_greater', (v_old_sub.current_period_end > now())
  );

  IF v_old_sub IS NOT NULL AND v_old_sub.current_period_end > now() THEN
    v_base_date := v_old_sub.current_period_end;
    v_debug := v_debug || jsonb_build_object('if_branch', 'TRUE', 'v_base_date', v_base_date);
  ELSE
    v_debug := v_debug || jsonb_build_object('if_branch', 'FALSE', 'v_base_date', v_base_date);
  END IF;

  RETURN v_debug;
END;
$$;
SELECT * FROM public.debug_chariow4();

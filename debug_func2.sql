CREATE OR REPLACE FUNCTION public.debug_chariow2()
RETURNS TABLE (val text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_res jsonb;
  v_old_sub record;
  v_free_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  v_res := public.process_chariow_payment(
    p_user_id := v_user_id,
    p_provider_event_id := 'debug_sale_3',
    p_plan_code := 'ESSENTIAL',
    p_amount := 2500,
    p_currency := 'XOF',
    p_billing_interval := 'monthly',
    p_metadata := '{}'::jsonb
  );

  -- Let's run the subquery
  SELECT id INTO v_free_id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1;
  RETURN QUERY SELECT 'v_free_id=' || coalesce(v_free_id::text, 'null');

  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = v_user_id;
  RETURN QUERY SELECT 'found by user_id: ' || v_old_sub.id::text;

  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = v_user_id AND status = 'active';
  RETURN QUERY SELECT 'found by status: ' || v_old_sub.id::text;

  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = v_user_id AND plan_id != (SELECT id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1);
  RETURN QUERY SELECT 'found by plan_id: ' || coalesce(v_old_sub.id::text, 'null');

END;
$$;
SELECT * FROM public.debug_chariow2();

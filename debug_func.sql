CREATE OR REPLACE FUNCTION public.debug_chariow()
RETURNS TABLE (sub_start timestamptz, sub_end timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_res jsonb;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  v_res := public.process_chariow_payment(
    p_user_id := v_user_id,
    p_provider_event_id := 'debug_sale_1',
    p_plan_code := 'ESSENTIAL',
    p_amount := 2500,
    p_currency := 'XOF',
    p_billing_interval := 'monthly',
    p_metadata := '{}'::jsonb
  );

  v_res := public.process_chariow_payment(
    p_user_id := v_user_id,
    p_provider_event_id := 'debug_sale_2',
    p_plan_code := 'ESSENTIAL',
    p_amount := 2500,
    p_currency := 'XOF',
    p_billing_interval := 'monthly',
    p_metadata := '{}'::jsonb
  );

  RETURN QUERY SELECT current_period_start, current_period_end FROM public.billing_subscriptions WHERE user_id = v_user_id ORDER BY created_at ASC;
END;
$$;
SELECT * FROM public.debug_chariow();

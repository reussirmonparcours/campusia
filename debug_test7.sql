DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_plan_id uuid;
  v_res jsonb;
BEGIN
  -- We need a real user ID from auth.users to satisfy foreign keys
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users';
  END IF;

  -- 1. First payment (Test 1 equivalent)
  v_res := public.process_chariow_payment(
    p_user_id := v_user_id,
    p_provider_event_id := 'debug_sale_1',
    p_plan_code := 'ESSENTIAL',
    p_amount := 2500,
    p_currency := 'XOF',
    p_billing_interval := 'monthly',
    p_metadata := '{}'::jsonb
  );
  RAISE NOTICE 'Test 1 result: %', v_res;

  -- 2. Early Renewal (Test 7 equivalent)
  v_res := public.process_chariow_payment(
    p_user_id := v_user_id,
    p_provider_event_id := 'debug_sale_2',
    p_plan_code := 'ESSENTIAL',
    p_amount := 2500,
    p_currency := 'XOF',
    p_billing_interval := 'monthly',
    p_metadata := '{}'::jsonb
  );
  RAISE NOTICE 'Test 7 result: %', v_res;

  -- Verify
  DECLARE
    v_sub record;
  BEGIN
    FOR v_sub IN SELECT * FROM public.billing_subscriptions WHERE user_id = v_user_id ORDER BY created_at ASC LOOP
      RAISE NOTICE 'Sub: start=% end=% status=%', v_sub.current_period_start, v_sub.current_period_end, v_sub.status;
    END LOOP;
  END;

  -- Cleanup
  DELETE FROM public.billing_subscriptions WHERE user_id = v_user_id;
  DELETE FROM public.billing_payment_events WHERE user_id = v_user_id;
END;
$$;

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_plan_id uuid;
  v_free_plan_id uuid;
  v_sub_id uuid;
  v_old_sub record;
  v_base_date timestamptz;
BEGIN
  -- Insert dummy user (must bypass auth constraints for this test, or we can just use a real user ID if we have one, but we don't. Let's just insert into auth.users directly if possible, or skip foreign key for this test? We can't skip FK)
  
  -- Let's just pick any existing user!
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users';
  END IF;

  SELECT id INTO v_plan_id FROM public.billing_plans WHERE code = 'ESSENTIAL' LIMIT 1;
  SELECT id INTO v_free_plan_id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1;

  -- Create a dummy subscription
  INSERT INTO public.billing_subscriptions (user_id, plan_id, status, billing_interval, current_period_start, current_period_end)
  VALUES (v_user_id, v_plan_id, 'active', 'monthly', now(), now() + interval '1 month')
  RETURNING id INTO v_sub_id;

  -- Run the query
  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = v_user_id 
    AND status = 'active' 
    AND plan_id != (SELECT id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1) 
  ORDER BY current_period_end DESC NULLS LAST
  FOR UPDATE
  LIMIT 1;

  IF v_old_sub IS NULL THEN
    RAISE EXCEPTION 'v_old_sub IS NULL. WHY?! plan_id=% free_plan=%', v_plan_id, v_free_plan_id;
  ELSE
    RAISE NOTICE 'FOUND! %', v_old_sub.id;
  END IF;

  -- Cleanup
  DELETE FROM public.billing_subscriptions WHERE id = v_sub_id;
END;
$$;

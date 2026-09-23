-- Migration: M10.8 Phase 3 Correction - Entitlement Periods & Lazy Resolution

-- 1. Drop the restrictive UNIQUE constraint that prevented multiple billing cycles per subscription
ALTER TABLE public.billing_entitlements DROP CONSTRAINT IF EXISTS billing_entitlements_subscription_id_feature_code_key;

-- 2. Create the Lazy Resolution Function
CREATE OR REPLACE FUNCTION public.resolve_active_entitlements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_next_start timestamptz;
  v_next_end timestamptz;
  v_plan_ent record;
  v_has_active boolean;
BEGIN
  -- Find all subscriptions for the user that should be active right now
  FOR v_sub IN 
    SELECT * FROM public.billing_subscriptions 
    WHERE user_id = p_user_id 
      AND status = 'active'
      AND current_period_start <= now()
      AND current_period_end > now()
  LOOP
    -- For each feature defined in the plan
    FOR v_plan_ent IN 
      SELECT * FROM public.billing_plan_entitlements WHERE plan_id = v_sub.plan_id
    LOOP
      -- Check if there is an entitlement covering 'now()'
      SELECT EXISTS (
        SELECT 1 FROM public.billing_entitlements
        WHERE subscription_id = v_sub.id 
          AND feature_code = v_plan_ent.feature_code
          AND current_period_start <= now()
          AND current_period_end > now()
      ) INTO v_has_active;

      IF NOT v_has_active THEN
        -- Find where the last entitlement ended
        SELECT MAX(current_period_end) INTO v_next_start
        FROM public.billing_entitlements
        WHERE subscription_id = v_sub.id AND feature_code = v_plan_ent.feature_code;

        -- If none, start from the subscription start date
        IF v_next_start IS NULL THEN
          v_next_start := v_sub.current_period_start;
        END IF;

        -- Generate missing periods up to the current one
        -- (This loop runs once per month, or catches up if there was a gap)
        WHILE v_next_start <= now() AND v_next_start < v_sub.current_period_end LOOP
          -- A quota cycle is exactly 1 month, bounded by the absolute end of the subscription
          v_next_end := LEAST(v_next_start + interval '1 month', v_sub.current_period_end);
          
          INSERT INTO public.billing_entitlements (
            user_id, subscription_id, feature_code, granted_value, current_period_start, current_period_end
          ) VALUES (
            p_user_id, v_sub.id, v_plan_ent.feature_code, v_plan_ent.limit_value, v_next_start, v_next_end
          );
          
          v_next_start := v_next_end;
          
          -- If we just created the one covering 'now()', we can stop.
          IF v_next_end > now() THEN
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 3. Modify consume_usage to trigger lazy resolution
CREATE OR REPLACE FUNCTION public.consume_usage(
  p_feature_code text,
  p_request_id text,
  p_action_type text,
  p_units integer,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_entitlement record;
  v_used_units integer;
  v_ledger_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify request_id idempotence early
  IF EXISTS (SELECT 1 FROM public.billing_usage_ledger WHERE request_id = p_request_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'message', 'Already consumed'
    );
  END IF;

  -- VERY IMPORTANT: Trigger lazy generation of missing entitlements for the current month
  PERFORM public.resolve_active_entitlements(v_user_id);

  -- 1. Find the active entitlement for this feature
  SELECT e.* INTO v_entitlement
  FROM public.billing_entitlements e
  JOIN public.billing_subscriptions s ON s.id = e.subscription_id
  WHERE e.user_id = v_user_id
    AND e.feature_code = p_feature_code
    AND s.status = 'active'
    AND (e.current_period_start <= now())
    AND (e.current_period_end IS NULL OR e.current_period_end > now())
  FOR UPDATE OF e LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_ACTIVE_ENTITLEMENT');
  END IF;

  -- 2. Calculate current usage (sum of CONSUMED and RESERVED)
  SELECT COALESCE(SUM(units), 0) INTO v_used_units
  FROM public.billing_usage_ledger
  WHERE entitlement_id = v_entitlement.id
    AND status IN ('CONSUMED', 'RESERVED');

  -- 3. Check if sufficient quota
  IF (v_entitlement.granted_value - v_used_units) < p_units THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'INSUFFICIENT_QUOTA',
      'granted', v_entitlement.granted_value,
      'used', v_used_units,
      'remaining', v_entitlement.granted_value - v_used_units
    );
  END IF;

  -- 4. Insert usage (append-only)
  INSERT INTO public.billing_usage_ledger (
    user_id, subscription_id, entitlement_id, request_id, action_type, units, status, metadata
  ) VALUES (
    v_user_id, v_entitlement.subscription_id, v_entitlement.id, p_request_id, p_action_type, p_units, 'CONSUMED', p_metadata
  ) RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'ledger_id', v_ledger_id,
    'granted', v_entitlement.granted_value,
    'used', v_used_units + p_units,
    'remaining', v_entitlement.granted_value - (v_used_units + p_units)
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Already consumed');
END;
$$;

-- 4. Update process_chariow_payment to use the new architecture
CREATE OR REPLACE FUNCTION public.process_chariow_payment(
  p_user_id uuid,
  p_provider_event_id text,
  p_plan_code text,
  p_amount numeric,
  p_currency text,
  p_billing_interval public.billing_interval,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_sub_id uuid;
  v_old_sub record;
  v_payment_event record;
  v_base_date timestamptz;
  v_end_date timestamptz;
BEGIN
  -- 1. Idempotency Check & Lock
  SELECT * INTO v_payment_event 
  FROM public.billing_payment_events 
  WHERE provider_event_id = p_provider_event_id 
  FOR UPDATE;

  IF v_payment_event IS NOT NULL THEN
    IF v_payment_event.status = 'processed' THEN
      RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Payment event already processed');
    END IF;

    IF v_payment_event.status = 'pending_resolution' AND p_user_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'status', 'pending_resolution', 'message', 'User still not found, event remains pending');
    END IF;
  END IF;

  -- 2. Handle User Not Found (New Event)
  IF p_user_id IS NULL THEN
    INSERT INTO public.billing_payment_events (
      user_id, provider_event_id, provider, status, amount, currency, plan_code, billing_interval, metadata
    ) VALUES (
      NULL, p_provider_event_id, 'chariow', 'pending_resolution', p_amount, p_currency, p_plan_code, p_billing_interval, p_metadata
    );
    RETURN jsonb_build_object('success', false, 'status', 'pending_resolution', 'message', 'User not found, event saved');
  END IF;

  -- 3. Find Plan
  SELECT id INTO v_plan_id FROM public.billing_plans WHERE code = p_plan_code LIMIT 1;
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan % not found', p_plan_code;
  END IF;

  -- 4. Calculate Subscription Dates deterministically
  v_base_date := now();
  
  -- Check for existing active paid subscription to extend from its end date
  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan_id != (SELECT id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1) 
  ORDER BY current_period_end DESC NULLS LAST
  LIMIT 1;

  IF v_old_sub IS NOT NULL AND v_old_sub.current_period_end > now() THEN
    v_base_date := v_old_sub.current_period_end;
  END IF;
  -- We DO NOT cancel the old subscription! It continues serving entitlements until v_base_date.

  -- Add interval for the commercial period
  IF p_billing_interval = 'monthly' THEN
    v_end_date := v_base_date + interval '1 month';
  ELSIF p_billing_interval = 'annual' THEN
    v_end_date := v_base_date + interval '1 year';
  ELSE
    v_end_date := v_base_date + interval '1 month';
  END IF;

  -- 5. Create or Update Payment Event
  IF v_payment_event IS NOT NULL THEN
    UPDATE public.billing_payment_events 
    SET user_id = p_user_id, status = 'processed', processed_at = now(), metadata = p_metadata
    WHERE provider_event_id = p_provider_event_id;
  ELSE
    INSERT INTO public.billing_payment_events (
      user_id, provider_event_id, provider, status, amount, currency, plan_code, billing_interval, metadata, processed_at
    ) VALUES (
      p_user_id, p_provider_event_id, 'chariow', 'processed', p_amount, p_currency, p_plan_code, p_billing_interval, p_metadata, now()
    );
  END IF;

  -- 6. Create New Subscription
  INSERT INTO public.billing_subscriptions (
    user_id, plan_id, status, billing_interval, current_period_start, current_period_end
  ) VALUES (
    p_user_id, v_plan_id, 'active', p_billing_interval, v_base_date, v_end_date
  ) RETURNING id INTO v_sub_id;

  -- 7. Trigger Entitlement Resolution immediately
  -- This will create the current month's entitlement if the subscription starts today.
  -- If it starts in the future, it does nothing yet.
  PERFORM public.resolve_active_entitlements(p_user_id);

  RETURN jsonb_build_object('success', true, 'subscription_id', v_sub_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Payment event already processed concurrently');
END;
$$;

-- Explicit Security: Revoke access from authenticated users, grant only to service_role
REVOKE ALL ON FUNCTION public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb) FROM anon;

GRANT EXECUTE ON FUNCTION public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb) TO service_role;

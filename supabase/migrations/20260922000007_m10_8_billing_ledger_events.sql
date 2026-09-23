-- Migration: Billing Ledger Events (Targeted Accounting Correction)

-- 1. Modify constraints on billing_usage_ledger
ALTER TYPE public.billing_usage_status ADD VALUE IF NOT EXISTS 'COMMITTED';
ALTER TABLE public.billing_usage_ledger DROP CONSTRAINT IF EXISTS billing_usage_ledger_request_id_key;
ALTER TABLE public.billing_usage_ledger ADD CONSTRAINT billing_usage_ledger_request_id_status_key UNIQUE (request_id, status);

-- 2. Drop old RPCs to recreate them
DROP FUNCTION IF EXISTS public.consume_usage(text, text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.release_usage(text);

-- 3. reserve_usage (Replaces consume_usage)
CREATE OR REPLACE FUNCTION public.reserve_usage(
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

  -- 1. Find the active entitlement for this feature
  -- Lock the entitlement row to serialize concurrent consumptions
  SELECT e.* INTO v_entitlement
  FROM public.billing_entitlements e
  JOIN public.billing_subscriptions s ON s.id = e.subscription_id
  WHERE e.user_id = v_user_id
    AND e.feature_code = p_feature_code
    AND s.status = 'active'
    AND (e.current_period_start <= now())
    AND (e.current_period_end IS NULL OR e.current_period_end >= now())
  FOR UPDATE OF e LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_ACTIVE_ENTITLEMENT');
  END IF;

  -- 2. Calculate current usage
  -- Since RESERVED has positive units, COMMITTED has 0, RELEASED has negative units
  SELECT COALESCE(SUM(units), 0) INTO v_used_units
  FROM public.billing_usage_ledger
  WHERE entitlement_id = v_entitlement.id;

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

  -- 4. Insert reservation (append-only)
  INSERT INTO public.billing_usage_ledger (
    user_id, subscription_id, entitlement_id, request_id, action_type, units, status, metadata
  ) VALUES (
    v_user_id, v_entitlement.subscription_id, v_entitlement.id, p_request_id, p_action_type, p_units, 'RESERVED', p_metadata
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
    -- Fallback for idempotence
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Already reserved');
END;
$$;

-- 4. commit_usage
CREATE OR REPLACE FUNCTION public.commit_usage(
  p_request_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_reservation record;
  v_ledger_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify reservation exists and no commit/release exists
  SELECT * INTO v_reservation 
  FROM public.billing_usage_ledger 
  WHERE request_id = p_request_id AND user_id = v_user_id AND status = 'RESERVED';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'RESERVATION_NOT_FOUND');
  END IF;

  IF EXISTS (SELECT 1 FROM public.billing_usage_ledger WHERE request_id = p_request_id AND user_id = v_user_id AND status IN ('COMMITTED', 'RELEASED')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_COMMITTED_OR_RELEASED');
  END IF;

  -- Insert COMMIT (units = 0 to not affect sum, it just records the state transition)
  INSERT INTO public.billing_usage_ledger (
    user_id, subscription_id, entitlement_id, request_id, action_type, units, status, metadata
  ) VALUES (
    v_user_id, v_reservation.subscription_id, v_reservation.entitlement_id, p_request_id, v_reservation.action_type, 0, 'COMMITTED', p_metadata
  ) RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object('success', true, 'ledger_id', v_ledger_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Already committed');
END;
$$;

-- 5. release_usage
CREATE OR REPLACE FUNCTION public.release_usage(
  p_request_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_reservation record;
  v_ledger_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify reservation exists and no commit/release exists
  SELECT * INTO v_reservation 
  FROM public.billing_usage_ledger 
  WHERE request_id = p_request_id AND user_id = v_user_id AND status = 'RESERVED';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'RESERVATION_NOT_FOUND');
  END IF;

  IF EXISTS (SELECT 1 FROM public.billing_usage_ledger WHERE request_id = p_request_id AND user_id = v_user_id AND status IN ('COMMITTED', 'RELEASED')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_COMMITTED_OR_RELEASED');
  END IF;

  -- Insert RELEASED (units = -reserved.units)
  INSERT INTO public.billing_usage_ledger (
    user_id, subscription_id, entitlement_id, request_id, action_type, units, status, metadata
  ) VALUES (
    v_user_id, v_reservation.subscription_id, v_reservation.entitlement_id, p_request_id, v_reservation.action_type, -v_reservation.units, 'RELEASED', p_metadata
  ) RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object('success', true, 'ledger_id', v_ledger_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Already released');
END;
$$;

-- 6. Replace Trigger for Free Plan Idempotence
CREATE OR REPLACE FUNCTION public.handle_new_student_free_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan_id uuid;
  v_sub_id uuid;
BEGIN
  SELECT id INTO v_free_plan_id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1;
  
  IF v_free_plan_id IS NOT NULL THEN
    -- Idempotence: ensure user doesn't already have a FREE plan
    IF NOT EXISTS (SELECT 1 FROM public.billing_subscriptions WHERE user_id = NEW.user_id AND plan_id = v_free_plan_id) THEN
      INSERT INTO public.billing_subscriptions (
        user_id, plan_id, status, billing_interval, current_period_start, current_period_end
      ) VALUES (
        NEW.user_id, v_free_plan_id, 'active', 'one_off', now(), now() + interval '10 years'
      ) RETURNING id INTO v_sub_id;

      -- Copy entitlements
      INSERT INTO public.billing_entitlements (
        user_id, subscription_id, feature_code, granted_value, current_period_start, current_period_end
      )
      SELECT NEW.user_id, v_sub_id, feature_code, limit_value, now(), now() + interval '10 years'
      FROM public.billing_plan_entitlements
      WHERE plan_id = v_free_plan_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

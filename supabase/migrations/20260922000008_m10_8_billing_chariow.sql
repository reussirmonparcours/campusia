-- Migration: Billing Chariow RPC (Targeted Corrections)

-- Allow storing unresolved payment events
ALTER TABLE public.billing_payment_events ALTER COLUMN user_id DROP NOT NULL;

-- Drop the previous function if it exists to recreate it with the correct signature
DROP FUNCTION IF EXISTS public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb);

CREATE OR REPLACE FUNCTION public.process_chariow_payment(
  p_user_id uuid, -- Can be NULL if user not found, allowing us to save the event as pending_resolution
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
  -- Lock the row if it exists to prevent concurrent updates on the same sale
  SELECT * INTO v_payment_event 
  FROM public.billing_payment_events 
  WHERE provider_event_id = p_provider_event_id 
  FOR UPDATE;

  IF v_payment_event IS NOT NULL THEN
    -- If already processed, it is strictly idempotent
    IF v_payment_event.status = 'processed' THEN
      RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Payment event already processed');
    END IF;

    -- If pending_resolution but user STILL not found, just return pending again
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
  
  -- Check for existing active paid subscription
  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan_id != (SELECT id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1) 
  ORDER BY current_period_end DESC NULLS LAST
  LIMIT 1;

  IF v_old_sub IS NOT NULL THEN
    IF v_old_sub.current_period_end > now() THEN
      v_base_date := v_old_sub.current_period_end;
    END IF;
    -- Cancel the old one to avoid overlap, but we are capturing its time in v_base_date
    UPDATE public.billing_subscriptions 
    SET status = 'cancelled', cancelled_at = now(), updated_at = now()
    WHERE id = v_old_sub.id;
  END IF;

  -- Add interval
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
    p_user_id, v_plan_id, 'active', p_billing_interval, now(), v_end_date
  ) RETURNING id INTO v_sub_id;

  -- 7. Copy Entitlements
  INSERT INTO public.billing_entitlements (
    user_id, subscription_id, feature_code, granted_value, current_period_start, current_period_end
  )
  SELECT p_user_id, v_sub_id, feature_code, limit_value, now(), v_end_date
  FROM public.billing_plan_entitlements
  WHERE plan_id = v_plan_id;

  RETURN jsonb_build_object('success', true, 'subscription_id', v_sub_id);
EXCEPTION
  WHEN unique_violation THEN
    -- Fallback for concurrency idempotency on payment event
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Payment event already processed concurrently');
END;
$$;

-- 8. Explicit Security: Revoke access from authenticated users, grant only to service_role
REVOKE ALL ON FUNCTION public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb) FROM anon;

GRANT EXECUTE ON FUNCTION public.process_chariow_payment(uuid, text, text, numeric, text, public.billing_interval, jsonb) TO service_role;

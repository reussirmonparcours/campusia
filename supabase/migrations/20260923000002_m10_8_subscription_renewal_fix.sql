-- Migration: M10.8 Phase 3 Correction - Subscription Renewal
-- Fix early renewal overlapping periods and apply FOR UPDATE lock

CREATE OR REPLACE FUNCTION public.process_chariow_payment(
  p_user_id uuid,
  p_provider_event_id text,
  p_plan_code text,
  p_amount numeric,
  p_currency text,
  p_billing_interval billing_interval,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Check for existing active or queued paid subscription to extend from its end date
  SELECT * INTO v_old_sub 
  FROM public.billing_subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan_id != (SELECT id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1) 
  ORDER BY current_period_end DESC NULLS LAST
  FOR UPDATE
  LIMIT 1;

  IF v_old_sub.id IS NOT NULL AND v_old_sub.current_period_end > now() THEN
    v_base_date := v_old_sub.current_period_end;
  END IF;

  -- We DO NOT cancel the old subscription! It continues serving entitlements until v_base_date.
  -- The new subscription will start exactly at v_base_date, preventing overlap.

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
  -- If it starts in the future, it does nothing yet, avoiding premature quota allocation.
  PERFORM public.resolve_active_entitlements(p_user_id);

  RETURN jsonb_build_object('success', true, 'subscription_id', v_sub_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Payment event already processed concurrently');
END;
$function$;

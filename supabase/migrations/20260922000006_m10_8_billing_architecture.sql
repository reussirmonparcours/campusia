-- Migration: Billing, Entitlements & Usage Architecture

-- 1. Plans
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_price numeric(10,2) NOT NULL DEFAULT 0,
  annual_price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Plan Entitlements
CREATE TABLE IF NOT EXISTS public.billing_plan_entitlements (
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id) ON DELETE CASCADE,
  feature_code text NOT NULL,
  limit_value integer NOT NULL,
  PRIMARY KEY (plan_id, feature_code)
);

-- Insert default plans
INSERT INTO public.billing_plans (code, name, monthly_price, annual_price) VALUES
  ('FREE', 'Découverte', 0, 0),
  ('ESSENTIAL', 'Essentiel', 2500, 25000),
  ('COMPLETE', 'Complet', 3900, 39000)
ON CONFLICT (code) DO NOTHING;

-- Insert default limits
INSERT INTO public.billing_plan_entitlements (plan_id, feature_code, limit_value)
SELECT id, 'AI_UNITS', 30 FROM public.billing_plans WHERE code = 'FREE' ON CONFLICT DO NOTHING;
INSERT INTO public.billing_plan_entitlements (plan_id, feature_code, limit_value)
SELECT id, 'MAX_DOCUMENTS', 1 FROM public.billing_plans WHERE code = 'FREE' ON CONFLICT DO NOTHING;

INSERT INTO public.billing_plan_entitlements (plan_id, feature_code, limit_value)
SELECT id, 'AI_UNITS', 150 FROM public.billing_plans WHERE code = 'ESSENTIAL' ON CONFLICT DO NOTHING;
INSERT INTO public.billing_plan_entitlements (plan_id, feature_code, limit_value)
SELECT id, 'MAX_DOCUMENTS', 5 FROM public.billing_plans WHERE code = 'ESSENTIAL' ON CONFLICT DO NOTHING;

INSERT INTO public.billing_plan_entitlements (plan_id, feature_code, limit_value)
SELECT id, 'AI_UNITS', 400 FROM public.billing_plans WHERE code = 'COMPLETE' ON CONFLICT DO NOTHING;
INSERT INTO public.billing_plan_entitlements (plan_id, feature_code, limit_value)
SELECT id, 'MAX_DOCUMENTS', 20 FROM public.billing_plans WHERE code = 'COMPLETE' ON CONFLICT DO NOTHING;


-- 3. Subscriptions
CREATE TYPE public.billing_subscription_status AS ENUM ('active', 'pending', 'past_due', 'cancelled', 'expired');
CREATE TYPE public.billing_interval AS ENUM ('one_off', 'monthly', 'annual');

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id),
  status public.billing_subscription_status NOT NULL DEFAULT 'active',
  billing_interval public.billing_interval NOT NULL DEFAULT 'monthly',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Entitlements
CREATE TABLE IF NOT EXISTS public.billing_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  feature_code text NOT NULL,
  granted_value integer NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, feature_code)
);

-- 5. Usage Ledger (Append Only)
CREATE TYPE public.billing_usage_status AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED', 'REFUNDED');

CREATE TABLE IF NOT EXISTS public.billing_usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  entitlement_id uuid NOT NULL REFERENCES public.billing_entitlements(id) ON DELETE CASCADE,
  request_id text NOT NULL UNIQUE,
  action_type text NOT NULL,
  units integer NOT NULL,
  status public.billing_usage_status NOT NULL DEFAULT 'CONSUMED',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Payment Events (Preparation)
CREATE TABLE IF NOT EXISTS public.billing_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_event_id text NOT NULL UNIQUE,
  provider text NOT NULL,
  status text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL,
  plan_code text NOT NULL,
  billing_interval public.billing_interval NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_subs_user_id ON public.billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_status ON public.billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_ents_user_id ON public.billing_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_ents_sub_feature ON public.billing_entitlements(subscription_id, feature_code);
CREATE INDEX IF NOT EXISTS idx_billing_usage_user_id ON public.billing_usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_usage_entitlement ON public.billing_usage_ledger(entitlement_id);

-- RLS
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are viewable by everyone" ON public.billing_plans FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Plan entitlements are viewable by everyone" ON public.billing_plan_entitlements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their subscriptions" ON public.billing_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their entitlements" ON public.billing_entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their usage" ON public.billing_usage_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their payments" ON public.billing_payment_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Grants
GRANT SELECT ON public.billing_plans TO authenticated;
GRANT SELECT ON public.billing_plan_entitlements TO authenticated;
GRANT SELECT ON public.billing_subscriptions TO authenticated;
GRANT SELECT ON public.billing_entitlements TO authenticated;
GRANT SELECT ON public.billing_usage_ledger TO authenticated;
GRANT SELECT ON public.billing_payment_events TO authenticated;

-- RPC: consume_usage
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

  -- Verify request_id idempotence early (optional but good for clear error)
  IF EXISTS (SELECT 1 FROM public.billing_usage_ledger WHERE request_id = p_request_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'message', 'Already consumed'
    );
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
    -- Fallback for idempotence if the early check missed it due to high concurrency
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Already consumed');
END;
$$;

-- RPC: release_usage
CREATE OR REPLACE FUNCTION public.release_usage(
  p_request_id text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_ledger_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.billing_usage_ledger
  SET status = 'RELEASED'
  WHERE request_id = p_request_id AND user_id = v_user_id AND status != 'RELEASED'
  RETURNING id INTO v_ledger_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'USAGE_NOT_FOUND_OR_ALREADY_RELEASED');
  END IF;

  RETURN jsonb_build_object('success', true, 'ledger_id', v_ledger_id);
END;
$$;

-- Trigger to auto-provision FREE plan on new student profile
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
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_student_profile_created_billing
  AFTER INSERT ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_free_plan();

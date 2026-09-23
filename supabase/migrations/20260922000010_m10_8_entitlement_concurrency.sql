-- Migration: M10.8 Phase 3 Correction - Entitlement Concurrency

-- 1. Nettoyage des éventuels doublons (si cette migration est exécutée sur une base ayant subi la faille)
-- On conserve uniquement l'entitlement le plus récent (MAX id ou MAX created_at) pour chaque (subscription_id, feature_code, current_period_start)
DELETE FROM public.billing_entitlements a USING (
    SELECT subscription_id, feature_code, current_period_start, MIN(created_at) as min_created
    FROM public.billing_entitlements
    GROUP BY subscription_id, feature_code, current_period_start
    HAVING COUNT(*) > 1
) b
WHERE a.subscription_id = b.subscription_id 
  AND a.feature_code = b.feature_code 
  AND a.current_period_start = b.current_period_start 
  AND a.created_at > b.min_created;

-- 2. Ajout du Garde-Fou SQL stricte
ALTER TABLE public.billing_entitlements 
ADD CONSTRAINT billing_entitlements_sub_feat_start_key 
UNIQUE (subscription_id, feature_code, current_period_start);

-- 3. Rendre resolve_active_entitlements atomique
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
  -- 1. Find all active subscriptions for the user
  FOR v_sub IN 
    SELECT * FROM public.billing_subscriptions 
    WHERE user_id = p_user_id 
      AND status = 'active'
      AND current_period_start <= now()
      AND current_period_end > now()
  LOOP
    -- 2. For each feature in the subscription's plan
    FOR v_plan_ent IN 
      SELECT * FROM public.billing_plan_entitlements WHERE plan_id = v_sub.plan_id
    LOOP
      -- Check if there is a valid entitlement right now
      SELECT EXISTS (
        SELECT 1 FROM public.billing_entitlements
        WHERE subscription_id = v_sub.id 
          AND feature_code = v_plan_ent.feature_code
          AND current_period_start <= now()
          AND current_period_end > now()
      ) INTO v_has_active;

      IF NOT v_has_active THEN
        -- Find where we left off
        SELECT MAX(current_period_end) INTO v_next_start
        FROM public.billing_entitlements
        WHERE subscription_id = v_sub.id AND feature_code = v_plan_ent.feature_code;

        IF v_next_start IS NULL THEN
          v_next_start := v_sub.current_period_start;
        END IF;

        -- Fast forward to current period
        WHILE v_next_start <= now() AND v_next_start < v_sub.current_period_end LOOP
          v_next_end := LEAST(v_next_start + interval '1 month', v_sub.current_period_end);
          
          -- ATOMIC INSERT: Si 2 transactions arrivent ici, la deuxième fera DO NOTHING grâce au UNIQUE
          INSERT INTO public.billing_entitlements (
            user_id, subscription_id, feature_code, granted_value, current_period_start, current_period_end
          ) VALUES (
            p_user_id, v_sub.id, v_plan_ent.feature_code, v_plan_ent.limit_value, v_next_start, v_next_end
          ) ON CONFLICT (subscription_id, feature_code, current_period_start) DO NOTHING;
          
          v_next_start := v_next_end;
          
          IF v_next_end > now() THEN
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

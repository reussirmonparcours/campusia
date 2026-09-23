SELECT * 
FROM public.billing_subscriptions 
WHERE user_id = 'b702390d-d5da-4932-bf86-ce241698d34d'::uuid
  AND status = 'active' 
  AND plan_id != (SELECT id FROM public.billing_plans WHERE code = 'FREE' LIMIT 1) 
ORDER BY current_period_end DESC NULLS LAST
LIMIT 1;

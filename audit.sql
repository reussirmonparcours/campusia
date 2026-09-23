-- Audit all objects in one query
SELECT
  '000002_constraint' as step,
  indexname as name, indexdef as def
FROM pg_indexes 
WHERE tablename = 'documents' AND indexname = 'documents_storage_path_key'

UNION ALL

SELECT
  '000003_rpc' as step,
  routine_name as name, pg_get_functiondef(pg_proc.oid) as def
FROM information_schema.routines
JOIN pg_proc ON pg_proc.proname = routines.routine_name
WHERE routine_name = 'match_document_chunks'

UNION ALL

SELECT
  '000004_table' as step,
  table_name as name, 'table_exists' as def
FROM information_schema.tables WHERE table_name = 'learner_memory'

UNION ALL

SELECT
  '000005_trigger' as step,
  trigger_name as name, 'trigger_exists' as def
FROM information_schema.triggers WHERE event_object_table = 'learner_memory'

UNION ALL

SELECT
  '000006_tables' as step,
  table_name as name, 'table_exists' as def
FROM information_schema.tables WHERE table_name LIKE 'billing_%'

UNION ALL

SELECT
  '000007_constraint' as step,
  conname as name, pg_get_constraintdef(c.oid) as def
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'billing_usage_ledger' AND conname = 'billing_usage_ledger_request_id_status_key'

UNION ALL

SELECT
  '000007_rpc' as step,
  routine_name as name, 'exists' as def
FROM information_schema.routines 
WHERE routine_name IN ('reserve_usage', 'commit_usage', 'release_usage', 'consume_usage', 'process_chariow_payment', 'resolve_active_entitlements')

UNION ALL

SELECT
  '000010_constraint' as step,
  conname as name, pg_get_constraintdef(c.oid) as def
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'billing_entitlements' AND conname = 'billing_entitlements_sub_feat_start_key';


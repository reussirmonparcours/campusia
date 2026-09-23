import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey || !anonKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const authClient = createClient(supabaseUrl, anonKey);

async function runTests() {
  console.log("Starting Chariow Entitlement Periods DB Tests...");

  // Setup: Create 2 test users for isolation tests
  const emailA = `test_chariow_a_${Date.now()}@example.com`;
  const emailB = `test_chariow_b_${Date.now()}@example.com`;
  
  const [resA, resB] = await Promise.all([
    supabase.auth.admin.createUser({ email: emailA, password: "testpassword123", email_confirm: true }),
    supabase.auth.admin.createUser({ email: emailB, password: "testpassword123", email_confirm: true })
  ]);
  
  const userA = resA.data.user!.id;
  const userB = resB.data.user!.id;

  try {
    console.log(`Created test users: A=${userA}, B=${userB}`);
    
    // Log in user B for authenticated RPC calls
    await authClient.auth.signInWithPassword({ email: emailB, password: "testpassword123" });

    // TEST 1: Essential Monthly
    console.log("-> TEST 1: Essential Monthly");
    const sale1 = `sale_${Date.now()}_1`;
    let res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userA, p_provider_event_id: sale1, p_plan_code: "ESSENTIAL", 
      p_amount: 2500, p_currency: "XOF", p_billing_interval: "monthly", p_metadata: {}
    });
    if (!res.data?.success) {
      console.error(res.error, res.data);
      throw new Error("Test 1 Failed: Activation failed");
    }
    
    // Check subscription and entitlement
    const { data: subs1 } = await supabase.from('billing_subscriptions').select('*').eq('id', res.data.subscription_id).single();
    const { data: ents1 } = await supabase.from('billing_entitlements').select('*').eq('subscription_id', res.data.subscription_id).eq('feature_code', 'AI_UNITS').single();
    
    let subDuration = new Date(subs1.current_period_end).getTime() - new Date(subs1.current_period_start).getTime();
    let entDuration = new Date(ents1.current_period_end).getTime() - new Date(ents1.current_period_start).getTime();
    
    if (Math.abs(subDuration - 30*24*3600*1000) > 3*24*3600*1000) throw new Error("Test 1 Failed: Subscription duration not 1 month");
    if (Math.abs(entDuration - 30*24*3600*1000) > 3*24*3600*1000) throw new Error("Test 1 Failed: Entitlement duration not 1 month");
    if (ents1.granted_value !== 150) throw new Error("Test 1 Failed: Quota not 150");
    console.log("TEST 1 PASS");


    // TEST 3 & 13: Essential Annual
    console.log("-> TEST 3 & 13: Essential Annual");
    const sale3 = `sale_${Date.now()}_3`;
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userB, p_provider_event_id: sale3, p_plan_code: "ESSENTIAL", 
      p_amount: 25000, p_currency: "XOF", p_billing_interval: "annual", p_metadata: {}
    });
    
    const { data: subs3 } = await supabase.from('billing_subscriptions').select('*').eq('id', res.data.subscription_id).single();
    const { data: ents3 } = await supabase.from('billing_entitlements').select('*').eq('subscription_id', res.data.subscription_id).eq('feature_code', 'AI_UNITS');
    
    subDuration = new Date(subs3.current_period_end).getTime() - new Date(subs3.current_period_start).getTime();
    entDuration = new Date(ents3![0].current_period_end).getTime() - new Date(ents3![0].current_period_start).getTime();
    
    if (Math.abs(subDuration - 365*24*3600*1000) > 3*24*3600*1000) throw new Error("Test 3 Failed: Subscription duration not 1 year");
    if (Math.abs(entDuration - 30*24*3600*1000) > 3*24*3600*1000) throw new Error(`Test 3 Failed: Entitlement duration not 1 month (it is ${entDuration / (24*3600*1000)} days)`);
    if (ents3![0].granted_value !== 150) throw new Error("Test 3 Failed: Quota not 150");
    if (ents3!.length !== 1) throw new Error("Test 13 Failed: Created more than 1 entitlement immediately");
    console.log("TEST 3 & 13 PASS");


    // TEST 5 & 6 & 9: Generation du deuxieme cycle / Lazy / Concurrent
    console.log("-> TEST 5 & 6 & 9: Generation du deuxieme cycle concurrent");
    // We will spoof the first entitlement by making it expired in the past, so resolve_active_entitlements has to generate the next one.
    const spoofSubStart = new Date(Date.now() - 40*24*3600*1000).toISOString();
    const spoofEntEnd = new Date(Date.now() - 10*24*3600*1000).toISOString();
    await supabase.from('billing_subscriptions').update({ current_period_start: spoofSubStart }).eq('id', subs3.id);
    await supabase.from('billing_entitlements').update({ 
      current_period_start: spoofSubStart,
      current_period_end: spoofEntEnd
    }).eq('id', ents3![0].id);

    // Now if we consume_usage with 20 concurrent requests, it should trigger generation exactly once
    const concurrentCalls = [];
    for (let i = 0; i < 20; i++) {
      concurrentCalls.push(
        authClient.rpc("consume_usage", { 
          p_feature_code: "AI_UNITS", 
          p_request_id: `req_${Date.now()}_concurrent_${i}`, 
          p_action_type: "chat", 
          p_units: 1 
        }).then(res => { if(res.error) throw res.error; return res; })
      );
    }
    
    await Promise.all(concurrentCalls);
    
    // Check how many entitlements now exist for that exact new period (should be exactly 1)
    const { data: entsAfter } = await supabase.from('billing_entitlements')
      .select('*')
      .eq('subscription_id', subs3.id)
      .eq('feature_code', 'AI_UNITS')
      .eq('current_period_start', spoofEntEnd);
      
    if (entsAfter!.length !== 1) throw new Error(`Test 9 Failed: Expected exactly 1 entitlement for the new period, got ${entsAfter!.length}. Concurrency guard failed.`);
    
    // Check that we didn't double-consume or drop usage (we consumed 1 unit * 20 times = 20 units)
    const { data: ledgerRows } = await supabase.from('billing_usage_ledger').select('*').eq('entitlement_id', entsAfter![0].id);
    if (ledgerRows!.length !== 20) throw new Error(`Test 10 Failed: Expected 20 ledger rows, got ${ledgerRows!.length}. Concurrency dropped usages.`);
    
    console.log("TEST 5, 6, 9, 10 PASS: Lazy generation worked exactly once under massive concurrency. Usage was safely tracked.");


    // TEST RENEWAL 1, 3, 4: Renouvellement anticipé (1 mois)
    console.log("-> TEST RENEWAL 1, 3, 4: Renouvellement anticipé (1 mois)");
    const sale7 = `sale_${Date.now()}_7`;
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userA, p_provider_event_id: sale7, p_plan_code: "ESSENTIAL", 
      p_amount: 2500, p_currency: "XOF", p_billing_interval: "monthly", p_metadata: {}
    });
    
    // Check that we didn't cancel the old one, but queued a new one
    const { data: allSubsA } = await supabase.from('billing_subscriptions').select('*').eq('user_id', userA).order('created_at', { ascending: true });
    if (allSubsA!.length !== 2) throw new Error("Test 7 Failed: Expected 2 subscriptions");
    console.log("TEST 7 SUBS:", JSON.stringify(allSubsA, null, 2));
    if (allSubsA![0].status !== 'active') throw new Error("Test 7 Failed: Old subscription was cancelled!");
    if (new Date(allSubsA![1].current_period_start).getTime() !== new Date(allSubsA![0].current_period_end).getTime()) {
      throw new Error(`Test 7 Failed: New subscription doesn't start exactly when old one ends. sub1 start=${allSubsA![1].current_period_start}, sub0 end=${allSubsA![0].current_period_end}`);
    }
    
    const { data: allEntsA } = await supabase.from('billing_entitlements').select('*').eq('user_id', userA).eq('feature_code', 'AI_UNITS');
    if (allEntsA!.length !== 1) throw new Error(`Test Renewal 8 Failed: Expected exactly 1 active entitlement, got ${allEntsA!.length}. Double quota created!`);
    console.log("TEST RENEWAL 1, 3, 4, 8 PASS: Renewals queue perfectly without doubling quotas.");


    // TEST RENEWAL 6: Replay Chariow
    console.log("-> TEST RENEWAL 6: Replay Chariow");
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userA, p_provider_event_id: sale7, p_plan_code: "ESSENTIAL", 
      p_amount: 2500, p_currency: "XOF", p_billing_interval: "monthly", p_metadata: {}
    });
    if (!res.data?.idempotent) throw new Error("Test Renewal 6 Failed: Not idempotent");
    console.log("TEST RENEWAL 6 PASS");


    // TEST 11: Replay pending_resolution
    console.log("-> TEST 11: Replay pending_resolution");
    const sale11 = `sale_${Date.now()}_11`;
    // First, user missing
    await supabase.rpc("process_chariow_payment", {
      p_user_id: null, p_provider_event_id: sale11, p_plan_code: "ESSENTIAL", 
      p_amount: 2500, p_currency: "XOF", p_billing_interval: "monthly", p_metadata: {}
    });
    // Then user found
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userB, p_provider_event_id: sale11, p_plan_code: "ESSENTIAL", 
      p_amount: 2500, p_currency: "XOF", p_billing_interval: "monthly", p_metadata: {}
    });
    if (!res.data?.success || res.data?.status === 'pending_resolution') throw new Error("Test 11 Failed");
    console.log("TEST 11 PASS");

    console.log("All Entitlement DB Tests Passed Successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    await supabase.auth.admin.deleteUser(userA);
    await supabase.auth.admin.deleteUser(userB);
    console.log("Cleanup: Test users deleted.");
  }
}

runTests();

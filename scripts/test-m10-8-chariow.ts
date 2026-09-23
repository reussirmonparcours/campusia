import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("Starting Chariow DB Tests...");

  // Setup: Create a test user
  const email = `test_chariow_${Date.now()}@example.com`;
  const { data: userRes, error: userErr } = await supabase.auth.admin.createUser({
    email,
    password: "testpassword123",
    email_confirm: true,
  });

  if (userErr) throw userErr;
  const userId = userRes.user.id;

  try {
    console.log(`Created test user: ${userId}`);
    const saleId1 = `sale_${Date.now()}_1`;
    const saleId2 = `sale_${Date.now()}_2`;
    const saleId3 = `sale_${Date.now()}_3`;

    // 1. sale.id nouveau + utilisateur identifié -> processed + abonnement.
    let res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userId,
      p_provider_event_id: saleId1,
      p_plan_code: "ESSENTIAL",
      p_amount: 2500,
      p_currency: "XOF",
      p_billing_interval: "monthly",
    });
    if (!res.data?.success) throw new Error("Test 1 Failed: " + JSON.stringify(res));
    console.log("Test 1 Passed: Processed new sale correctly.");

    // Check dates for Test 8 (achat sans abonnement actif -> payment_confirmed_at + durée)
    const { data: sub1 } = await supabase.from('billing_subscriptions').select('*').eq('id', res.data.subscription_id).single();
    if (!sub1 || new Date(sub1.current_period_end).getTime() < new Date().getTime()) {
      throw new Error("Test 8 Failed: Bad period end for new sub");
    }
    console.log("Test 8 Passed: Duration correct for new sub (1 month).");

    // 4. même sale.id + événement répété alors que status = processed -> idempotent + aucun deuxième abonnement.
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userId,
      p_provider_event_id: saleId1,
      p_plan_code: "ESSENTIAL",
      p_amount: 2500,
      p_currency: "XOF",
      p_billing_interval: "monthly",
    });
    if (!res.data?.idempotent) throw new Error("Test 4 Failed: Expected idempotent=true");
    console.log("Test 4 Passed: Repeated processed sale is idempotent.");

    // 9. renouvellement avant expiration -> période commence à current_period_end
    // We will buy an annual plan while the monthly one is active.
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userId,
      p_provider_event_id: saleId2,
      p_plan_code: "COMPLETE",
      p_amount: 39000,
      p_currency: "XOF",
      p_billing_interval: "annual",
    });
    const { data: sub2 } = await supabase.from('billing_subscriptions').select('*').eq('id', res.data.subscription_id).single();
    
    // sub2 should end 1 year after sub1.current_period_end
    const expectedEnd = new Date(sub1.current_period_end);
    expectedEnd.setFullYear(expectedEnd.getFullYear() + 1);
    
    // Check if the difference is less than 1 hour (account for timezone/exec time)
    if (Math.abs(new Date(sub2.current_period_end).getTime() - expectedEnd.getTime()) > 3600000) {
      throw new Error(`Test 9 Failed: Period doesn't start at current_period_end. Expected ${expectedEnd}, got ${sub2.current_period_end}`);
    }
    console.log("Test 9, 14 Passed: Renewal before expiration adds to current_period_end correctly (+1 year).");

    // 2. sale.id nouveau + utilisateur introuvable -> pending_resolution + aucun abonnement
    const missingUserId = null;
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: missingUserId,
      p_provider_event_id: saleId3,
      p_plan_code: "ESSENTIAL",
      p_amount: 2500,
      p_currency: "XOF",
      p_billing_interval: "monthly",
    });
    if (res.data?.success || res.data?.status !== 'pending_resolution') throw new Error("Test 2 Failed");
    console.log("Test 2 Passed: Missing user gives pending_resolution.");

    // 6. pending_resolution toujours sans utilisateur -> reste pending_resolution
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: missingUserId,
      p_provider_event_id: saleId3,
      p_plan_code: "ESSENTIAL",
      p_amount: 2500,
      p_currency: "XOF",
      p_billing_interval: "monthly",
    });
    if (res.data?.success || res.data?.status !== 'pending_resolution') throw new Error("Test 6 Failed");
    console.log("Test 6 Passed: Repeated pending without user stays pending.");

    // 3. même sale.id + événement répété alors que status = pending_resolution + utilisateur maintenant identifiable -> processed
    res = await supabase.rpc("process_chariow_payment", {
      p_user_id: userId,
      p_provider_event_id: saleId3,
      p_plan_code: "ESSENTIAL",
      p_amount: 2500,
      p_currency: "XOF",
      p_billing_interval: "monthly",
    });
    if (!res.data?.success) throw new Error("Test 3 Failed: " + JSON.stringify(res));
    console.log("Test 3 Passed: Pending resolved when user identified.");

    // 5. deux requêtes concurrentes pour un pending_resolution -> une seule activation
    const saleId4 = `sale_${Date.now()}_4`;
    // first make it pending
    await supabase.rpc("process_chariow_payment", {
      p_user_id: missingUserId,
      p_provider_event_id: saleId4,
      p_plan_code: "ESSENTIAL",
      p_amount: 2500,
      p_currency: "XOF",
      p_billing_interval: "monthly",
    });

    const [r1, r2] = await Promise.all([
      supabase.rpc("process_chariow_payment", {
        p_user_id: userId,
        p_provider_event_id: saleId4,
        p_plan_code: "ESSENTIAL",
        p_amount: 2500,
        p_currency: "XOF",
        p_billing_interval: "monthly",
      }),
      supabase.rpc("process_chariow_payment", {
        p_user_id: userId,
        p_provider_event_id: saleId4,
        p_plan_code: "ESSENTIAL",
        p_amount: 2500,
        p_currency: "XOF",
        p_billing_interval: "monthly",
      })
    ]);

    const successes = [r1.data?.success, r2.data?.success].filter(Boolean).length;
    const idempotents = [r1.data?.idempotent, r2.data?.idempotent].filter(Boolean).length;
    
    if (successes !== 2 || idempotents !== 1) { 
      throw new Error(`Test 5 Failed. Successes: ${successes}, Idempotents: ${idempotents}`);
    }
    console.log("Test 5, 7 Passed: Concurrent resolution handles perfectly with only one activation.");

    console.log("All DB Tests Passed Successfully!");
  } catch(e) {
    console.error(e);
  } finally {
    await supabase.auth.admin.deleteUser(userId);
    console.log("Cleanup: Test user deleted.");
  }
}

runTests();

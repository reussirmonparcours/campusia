import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import * as crypto from "crypto";
import { BillingRepository } from "../src/lib/billing/repository";
import { UsageActionTypes, FeatureCode } from "../src/lib/billing/types";

const uuidv4 = () => crypto.randomUUID();

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log("TEST SKIPPED: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
  process.exit(0);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log("Starting M10.8 Billing Concurrency & Integration Tests...");

  try {
    // 1. Setup Mock Users
    const emailA = `test-A-${Date.now()}@example.com`;
    const emailB = `test-B-${Date.now()}@example.com`;
    const pwd = "Password123!";

    const { data: userA, error: errA } = await adminClient.auth.admin.createUser({ email: emailA, password: pwd, email_confirm: true });
    const { data: userB, error: errB } = await adminClient.auth.admin.createUser({ email: emailB, password: pwd, email_confirm: true });

    if (errA || errB) throw new Error("Failed to create mock users");
    const uidA = userA.user.id;
    const uidB = userB.user.id;

    console.log(`Created User A: ${uidA}`);
    console.log(`Created User B: ${uidB}`);

    // Create student profiles to trigger FREE plan
    await adminClient.from("student_profiles").insert({ user_id: uidA, first_name: "A", last_name: "Test" });
    await adminClient.from("student_profiles").insert({ user_id: uidB, first_name: "B", last_name: "Test" });

    // Login users to get authenticated clients
    const clientA = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const clientB = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    await clientA.auth.signInWithPassword({ email: emailA, password: pwd });
    await clientB.auth.signInWithPassword({ email: emailB, password: pwd });

    // 2. Test A receives FREE plan and 30 AI_UNITS
    const entitlementA = await BillingRepository.getActiveEntitlement(clientA, uidA, "AI_UNITS");
    if (!entitlementA || entitlementA.granted_value !== 30) throw new Error("A did not receive 30 AI_UNITS FREE plan");
    console.log("✓ A received FREE plan and 30 AI_UNITS");

    // 3. A cannot INSERT/UPDATE/DELETE ledger (RLS)
    const { error: insertErr } = await clientA.from("billing_usage_ledger").insert({ user_id: uidA, subscription_id: entitlementA.subscription_id, entitlement_id: entitlementA.id, request_id: "fake", action_type: "fake", units: 1, status: 'RESERVED' });
    if (!insertErr) throw new Error("A was able to INSERT directly into ledger");
    console.log("✓ RLS blocks direct INSERT into ledger");

    // 4. A cannot access B's data
    const { data: dataBforA } = await clientA.from("billing_entitlements").select("*").eq("user_id", uidB);
    if (dataBforA && dataBforA.length > 0) throw new Error("A can access B's entitlements");
    console.log("✓ RLS isolates A and B");

    // 5. Test normal reserve
    const req1 = uuidv4();
    const res1 = await BillingRepository.reserveUsage(clientA, "AI_UNITS", req1, UsageActionTypes.AI_CHAT_RAG);
    if (!res1.success) throw new Error("Normal reservation failed");
    console.log("✓ A can reserve quota normally");

    // 6. Test idempotence (same request ID)
    const res1Dup = await BillingRepository.reserveUsage(clientA, "AI_UNITS", req1, UsageActionTypes.AI_CHAT_RAG);
    if (!res1Dup.success || !res1Dup.idempotent) throw new Error("Idempotence failed for reserve");
    console.log("✓ Reservation is idempotent");

    // 7. Test commit
    const commit1 = await BillingRepository.commitUsage(clientA, req1);
    if (!commit1.success) throw new Error("Commit failed");
    console.log("✓ Commit successful after reserve");

    // 8. Test double commit
    const commit1Dup = await BillingRepository.commitUsage(clientA, req1);
    if (!commit1Dup.idempotent && !commit1Dup.error?.includes("ALREADY")) throw new Error("Double commit not blocked properly");
    console.log("✓ Double commit is blocked");

    // 9. Test release after commit (should fail)
    const release1 = await BillingRepository.releaseUsage(clientA, req1);
    if (release1.success) throw new Error("Release succeeded after commit!");
    console.log("✓ Release after commit is blocked");

    // 10. Test concurrency (Promise.all)
    // A has 30 units, used 2 (AI_CHAT_RAG = 2). Remaining 28.
    // Let's try 15 concurrent reservations of 2 units. 14 should succeed, 1 should fail due to INSUFFICIENT_QUOTA.
    console.log("Testing concurrency with 15 requests...");
    const reqs = Array.from({ length: 15 }, () => uuidv4());
    const promises = reqs.map(reqId => BillingRepository.reserveUsage(clientA, "AI_UNITS", reqId, UsageActionTypes.AI_CHAT_RAG));
    const results = await Promise.all(promises);

    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success && r.error === "INSUFFICIENT_QUOTA").length;

    console.log(`Concurrency results: ${successes} successes, ${failures} quota failures`);
    if (successes !== 14 || failures !== 1) throw new Error("Concurrency lock failed. Quota was exceeded or under-utilized.");
    console.log("✓ Concurrency FOR UPDATE works flawlessly");

    // Check final quota via getQuotaStatus
    const quotaState = await BillingRepository.getQuotaStatus(clientA, entitlementA.id, 30);
    if (quotaState.used !== 30 || quotaState.remaining !== 0) throw new Error("Final quota sum is incorrect");
    console.log("✓ Quota math is absolutely perfect (granted 30, used 30, remaining 0)");

    // Cleanup
    await adminClient.auth.admin.deleteUser(uidA);
    await adminClient.auth.admin.deleteUser(uidB);
    console.log("✓ Cleanup done.");
    console.log("\nALL TESTS PASSED SUCCESSFULLY! 🚀");
  } catch (err) {
    console.error("TEST FAILED:", err);
    process.exit(1);
  }
}

runTests();

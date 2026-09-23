import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { Retriever } from "../src/lib/rag/retriever";
import { MockEmbeddingProvider } from "../src/lib/rag/embeddings/mock-provider";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("=== M10.4 RUNTIME STAGING TESTS ===");

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Create two test users
  const userA = await adminClient.auth.admin.createUser({ email: "user_a_m104@test.com", password: "password123", email_confirm: true });
  const userB = await adminClient.auth.admin.createUser({ email: "user_b_m104@test.com", password: "password123", email_confirm: true });

  if (!userA.data.user || !userB.data.user) {
    throw new Error("Failed to create test users");
  }

  try {
    const uniqueSuffix = Date.now().toString();
    const { data: offSubject, error: offErr } = await adminClient.from("subjects").insert({ name: "Official M10.4 " + uniqueSuffix, code: "OFF-104-" + uniqueSuffix }).select().single();
    const { data: privSubjectA, error: privAErr } = await adminClient.from("subjects").insert({ name: "Private A " + uniqueSuffix, created_by: userA.data.user.id }).select().single();
    const { data: privSubjectB, error: privBErr } = await adminClient.from("subjects").insert({ name: "Private B " + uniqueSuffix, created_by: userB.data.user.id }).select().single();
    
    if (offErr || privAErr || privBErr) {
      console.error(offErr, privAErr, privBErr);
      throw new Error("Failed to create subjects");
    }

    // 3. Fake embeddings
    const embProvider = new MockEmbeddingProvider();
    // Use an array of 1536 elements for exact matches
    const baseVector = Array(1536).fill(0.01);
    const perfectVector = [...baseVector]; perfectVector[0] = 1.0; // High similarity
    const poorVector = [...baseVector]; poorVector[0] = -1.0; // Low similarity
    
    // 4. Insert documents and chunks
    const { data: docOff } = await adminClient.from("documents").insert({ storage_path: "off.pdf", subject_id: offSubject!.id, provenance: "OFFICIAL" }).select().single();
    const { data: docA } = await adminClient.from("documents").insert({ storage_path: "a.pdf", subject_id: privSubjectA!.id, provenance: "STUDENT", owner_id: userA.data.user.id }).select().single();
    const { data: docB } = await adminClient.from("documents").insert({ storage_path: "b.pdf", subject_id: privSubjectB!.id, provenance: "STUDENT", owner_id: userB.data.user.id }).select().single();
    
    await adminClient.from("document_chunks").insert([
      { document_id: docOff!.id, content: "Official content", embedding: perfectVector, page_number: 1 },
      
      // Document A has multiple chunks for TopK and Threshold tests
      { document_id: docA!.id, content: "A content 1", embedding: perfectVector, page_number: 1 },
      { document_id: docA!.id, content: "A content 2", embedding: perfectVector, page_number: 2 },
      { document_id: docA!.id, content: "A content 3", embedding: perfectVector, page_number: 3 },
      { document_id: docA!.id, content: "A content 4", embedding: perfectVector, page_number: 4 },
      { document_id: docA!.id, content: "A content 5", embedding: perfectVector, page_number: 5 },
      { document_id: docA!.id, content: "A content poor", embedding: poorVector, page_number: 6 }, // Below threshold
      
      { document_id: docB!.id, content: "B content", embedding: perfectVector, page_number: 1 }
    ]);

    // Enroll User A in OFFICIAL subject
    await adminClient.from("student_subject_progress").insert({ user_id: userA.data.user.id, subject_id: offSubject!.id });

    // 5. Authenticate clients
    const { data: authA } = await adminClient.auth.signInWithPassword({ email: "user_a_m104@test.com", password: "password123" });
    const { data: authB } = await adminClient.auth.signInWithPassword({ email: "user_b_m104@test.com", password: "password123" });

    const clientA = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${authA.session!.access_token}` } } });
    const clientB = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${authB.session!.access_token}` } } });

    // Mock embedding provider to always return the "perfect" vector for querying
    embProvider.embed = async () => perfectVector;

    const retrieverA = new Retriever(clientA, embProvider);
    const retrieverB = new Retriever(clientB, embProvider);

    // Tests
    console.log("---");

    // A -> B isolation
    let passAB = true;
    try {
      const resAB = await retrieverA.retrieve("query", privSubjectB!.id);
      passAB = resAB.length === 0;
    } catch { passAB = true; } // Or access denied
    console.log("TEST: A -> B isolation\nCOMMAND: retrieverA.retrieve(privSubjectB)\nEXPECTED: 0 results\nACTUAL: " + (passAB ? "0" : ">0") + "\nPASS/FAIL: " + (passAB ? "PASS" : "FAIL"));
    console.log("---");

    // B -> A isolation
    let passBA = true;
    try {
      const resBA = await retrieverB.retrieve("query", privSubjectA!.id);
      passBA = resBA.length === 0;
    } catch { passBA = true; }
    console.log("TEST: B -> A isolation\nCOMMAND: retrieverB.retrieve(privSubjectA)\nEXPECTED: 0 results\nACTUAL: " + (passBA ? "0" : ">0") + "\nPASS/FAIL: " + (passBA ? "PASS" : "FAIL"));
    console.log("---");

    // Cross-subject
    const resCross = await retrieverA.retrieve("query", offSubject!.id);
    const passCross = resCross.every(c => c.documentId === docOff!.id);
    console.log("TEST: cross-subject\nCOMMAND: retrieverA.retrieve(offSubject)\nEXPECTED: Only offSubject docs\nACTUAL: " + (passCross ? "Match" : "Mismatch") + "\nPASS/FAIL: " + (passCross ? "PASS" : "FAIL"));
    console.log("---");

    // TopK
    const resTop1 = await retrieverA.retrieve("query", privSubjectA!.id, { topK: 1 });
    console.log("TEST: topK=1\nCOMMAND: topK: 1\nEXPECTED: <= 1 results\nACTUAL: " + resTop1.length + "\nPASS/FAIL: " + (resTop1.length <= 1 ? "PASS" : "FAIL"));
    
    const resTop3 = await retrieverA.retrieve("query", privSubjectA!.id, { topK: 3 });
    console.log("TEST: topK=3\nCOMMAND: topK: 3\nEXPECTED: <= 3 results\nACTUAL: " + resTop3.length + "\nPASS/FAIL: " + (resTop3.length <= 3 ? "PASS" : "FAIL"));
    
    const resTop5 = await retrieverA.retrieve("query", privSubjectA!.id, { topK: 5 });
    console.log("TEST: topK=5\nCOMMAND: topK: 5\nEXPECTED: <= 5 results\nACTUAL: " + resTop5.length + "\nPASS/FAIL: " + (resTop5.length <= 5 ? "PASS" : "FAIL"));
    console.log("---");

    // Threshold high (e.g. 0.99 for perfect match only)
    const resThreshHigh = await retrieverA.retrieve("query", privSubjectA!.id, { matchThreshold: 0.99, topK: 10 });
    // Threshold low (e.g. -1.0 to include poor matches)
    const resThreshLow = await retrieverA.retrieve("query", privSubjectA!.id, { matchThreshold: -1.0, topK: 10 });
    const passThresh = resThreshHigh.length < resThreshLow.length && resThreshHigh.length === 5 && resThreshLow.length === 6;
    console.log("TEST: threshold élevé\nCOMMAND: matchThreshold: 0.99\nEXPECTED: exclude poor match\nACTUAL: " + resThreshHigh.length + " results\nPASS/FAIL: " + (passThresh ? "PASS" : "FAIL"));
    console.log("TEST: threshold bas\nCOMMAND: matchThreshold: -1.0\nEXPECTED: include poor match\nACTUAL: " + resThreshLow.length + " results\nPASS/FAIL: " + (passThresh ? "PASS" : "FAIL"));
    console.log("---");

    // RAG_NO_SOURCES
    const hasAnyB = await retrieverA.hasAnyDocuments(privSubjectB!.id);
    console.log("TEST: RAG_NO_SOURCES\nCOMMAND: hasAnyDocuments(privSubjectB)\nEXPECTED: false\nACTUAL: " + hasAnyB + "\nPASS/FAIL: " + (!hasAnyB ? "PASS" : "FAIL"));
    console.log("---");

    // RAG_INSUFFICIENT_CONTEXT (has docs, but threshold blocks it)
    const hasAnyOff = await retrieverA.hasAnyDocuments(offSubject!.id);
    embProvider.embed = async () => poorVector; // Change query to poor vector so it doesn't match perfect docs
    const resOff = await retrieverA.retrieve("query", offSubject!.id, { matchThreshold: 0.9 });
    const passInsufficient = hasAnyOff && resOff.length === 0;
    console.log("TEST: RAG_INSUFFICIENT_CONTEXT\nCOMMAND: hasAnyDocuments=true AND retrieve=0\nEXPECTED: true, 0\nACTUAL: " + hasAnyOff + ", " + resOff.length + "\nPASS/FAIL: " + (passInsufficient ? "PASS" : "FAIL"));
    console.log("---");

  } finally {
    // Cleanup
    await adminClient.auth.admin.deleteUser(userA.data.user.id);
    await adminClient.auth.admin.deleteUser(userB.data.user.id);
    // Subjects have ON DELETE CASCADE so they will clean up documents and chunks automatically.
    await adminClient.from("subjects").delete().eq("name", "Official M10.4");
    await adminClient.from("subjects").delete().eq("name", "Private A");
    await adminClient.from("subjects").delete().eq("name", "Private B");
    console.log("Cleanup complete.");
  }
}

main().catch(console.error);

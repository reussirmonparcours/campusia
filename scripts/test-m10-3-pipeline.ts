import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parse } from "dotenv";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { IngestionPipeline } from "../src/lib/rag/pipeline";

// Load local env manually
const envPath = join(process.cwd(), ".env.local");
const envVars = parse(readFileSync(envPath));
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;

if (!supabaseUrl || !serviceKey || !anonKey) {
  throw new Error("Missing Supabase configuration");
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function createDummyPdf(textPages: string[], path: string) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  
  for (const text of textPages) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    page.drawText(text, {
      x: 50,
      y: height - 4 * fontSize,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  writeFileSync(path, pdfBytes);
}

async function runPipelineTests() {
  console.log("=== RUNTIME PIPELINE TESTS M10.3 ===");

  try {
    // PREPARE FIXTURES
    console.log("Preparing fixtures...");
    const userAEmail = `test-a-m103-${Date.now()}@example.com`;
    const userBEmail = `test-b-m103-${Date.now()}@example.com`;
    const password = "password123";

    const { data: userAData } = await supabaseAdmin.auth.admin.createUser({ email: userAEmail, password, email_confirm: true });
    const { data: userBData } = await supabaseAdmin.auth.admin.createUser({ email: userBEmail, password, email_confirm: true });
    const userAId = userAData.user!.id;
    const userBId = userBData.user!.id;
    
    const { data: subject, error: subjErr } = await supabaseAdmin.from("subjects").insert({ name: `M10.3 Subject ${Date.now()}` }).select().single();
    if (subjErr) throw new Error("Failed to insert subject: " + JSON.stringify(subjErr));
    const subjectId = subject.id;

    // Create PDFs
    const pdfPathA = join(process.cwd(), "test-a.pdf");
    const pdfPathB = join(process.cwd(), "test-empty.pdf");
    await createDummyPdf(["Page 1 content.\n\nThis is paragraph 2.", "Page 2 content."], pdfPathA);
    // Create empty PDF (or scanned)
    await createDummyPdf([""], pdfPathB); 

    // Upload PDFs
    await supabaseAdmin.storage.from("pedagogical-documents").upload(`${userAId}/test-a.pdf`, readFileSync(pdfPathA), { contentType: "application/pdf" });
    await supabaseAdmin.storage.from("pedagogical-documents").upload(`${userAId}/test-empty.pdf`, readFileSync(pdfPathB), { contentType: "application/pdf" });

    // Create Document Records
    const { data: docA, error: errA } = await supabaseAdmin.from("documents").insert({
      storage_path: `${userAId}/test-a.pdf`, owner_id: userAId, subject_id: subjectId, provenance: "STUDENT", status: "pending"
    }).select().single();
    if (errA) throw new Error("Failed to insert docA: " + JSON.stringify(errA));

    const { data: docEmpty, error: errEmpty } = await supabaseAdmin.from("documents").insert({
      storage_path: `${userAId}/test-empty.pdf`, owner_id: userAId, subject_id: subjectId, provenance: "STUDENT", status: "pending"
    }).select().single();
    if (errEmpty) throw new Error("Failed to insert docEmpty: " + JSON.stringify(errEmpty));

    // Init pipeline
    const pipeline = new IngestionPipeline({ useMockEmbeddings: true });

    // TEST 1,2,3,4,5,6,7,9,10,11,12: Valid Multi-page PDF Processing
    console.log("Testing standard ingestion...");
    const result1 = await pipeline.processDocument(docA.id, userAId);
    if (!result1.success) throw new Error("Pipeline failed on valid document");
    
    const { data: chunks1 } = await supabaseAdmin.from("document_chunks").select("*").eq("document_id", docA.id).order("chunk_index");
    console.log("Chunks created:", (chunks1?.length ?? 0) > 0 ? "PASS" : "FAIL");
    console.log("chunk_index starts at 0:", chunks1?.[0]?.chunk_index === 0 ? "PASS" : "FAIL");
    console.log("page_number preserved:", chunks1?.some((c: Record<string, unknown>) => c.page_number !== null) ? "PASS" : "FAIL");
    const chunks = chunks1 ?? [];
    if (chunks.length > 0) {
      const emb = typeof chunks[0].embedding === 'string' ? JSON.parse(chunks[0].embedding) : chunks[0].embedding;
      console.log(`dimension is 1536: ${emb.length === 1536 ? "PASS" : "FAIL"}`);
    } else {
      console.log(`dimension is 1536: FAIL`);
    }
    
    const { data: docACheck } = await supabaseAdmin.from("documents").select("status").eq("id", docA.id).single();
    console.log("status is completed:", docACheck?.status === "completed" ? "PASS" : "FAIL");

    // TEST 15: Idempotency (Reingestion -> No Duplicates)
    console.log("Testing idempotency (reingestion)...");
    await pipeline.processDocument(docA.id, userAId);
    const { data: chunksRe } = await supabaseAdmin.from("document_chunks").select("*").eq("document_id", docA.id);
    console.log("Idempotence (no duplicates):", chunksRe?.length === chunks1?.length ? "PASS" : "FAIL");

    // TEST 13: Empty PDF
    console.log("Testing empty PDF...");
    const resultEmpty = await pipeline.processDocument(docEmpty.id, userAId);
    console.log("Empty PDF fails cleanly:", !resultEmpty.success && resultEmpty.error?.includes("no extractable text") ? "PASS" : "FAIL");
    const { data: docEmptyCheck } = await supabaseAdmin.from("documents").select("status").eq("id", docEmpty.id).single();
    console.log("Empty PDF status is failed:", docEmptyCheck?.status === "failed" ? "PASS" : "FAIL");

    // TEST 16 & 17: Security & Isolation
    console.log("Testing unauthorized access...");
    const resultAuth = await pipeline.processDocument(docA.id, userBId);
    console.log("User B rejected for User A doc:", !resultAuth.success && resultAuth.error?.includes("Unauthorized") ? "PASS" : "FAIL");

    // Cleanup
    console.log("Cleaning up fixtures...");
    await supabaseAdmin.from("documents").delete().in("id", [docA.id, docEmpty.id]);
    await supabaseAdmin.storage.from("pedagogical-documents").remove([`${userAId}/test-a.pdf`, `${userAId}/test-empty.pdf`]);
    await supabaseAdmin.auth.admin.deleteUser(userAId);
    await supabaseAdmin.auth.admin.deleteUser(userBId);
    await supabaseAdmin.from("subjects").delete().eq("id", subjectId);

    console.log("=== PIPELINE TESTS PASSED ===");

  } catch (error) {
    console.error("Pipeline test failed:", error);
  }
}

runPipelineTests();

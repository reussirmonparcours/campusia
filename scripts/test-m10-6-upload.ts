import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { IngestionPipeline } from "../src/lib/rag/pipeline";
import { registerStudentDocument } from "../src/lib/rag/actions";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// We need to bypass some auth flow for testing, so we'll just test the DB constraints using the service client and mock auth for the server actions.
// Actually, server actions use `await createClient()` which relies on cookies.
// To test server actions in a script, it's complex without a real browser.
// Let's test the DB RLS and storage instead directly via standard JS clients using different auth states.

async function main() {
  console.log("Staging Test for M10.6 Student Upload...");
  
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  
  // Create a test user
  const { data: userAuth, error: authErr } = await adminClient.auth.admin.createUser({
    email: `student_${Date.now()}@test.com`,
    password: "password123",
    email_confirm: true
  });
  
  if (authErr) throw authErr;
  const user = userAuth.user;
  
  console.log(`Created test user: ${user.id}`);
  
  // Sign in as this user to get a session
  const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  await userClient.auth.signInWithPassword({
    email: user.email!,
    password: "password123"
  });

  try {
    console.log("1. Testing Storage Upload...");
    const fileName = "test-doc.pdf";
    
    // Create a real valid PDF for pdf-parse
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    page.drawText('This is a test student document about artificial intelligence!', {
      x: 50,
      y: height - 4 * 24,
      size: 24,
      color: rgb(0, 0, 0),
    });
    const pdfBytes = await pdfDoc.save();
    
    const fileContent = new Blob([pdfBytes as any], { type: "application/pdf" });
    const storagePath = `${user.id}/${crypto.randomUUID()}.pdf`;

    const { error: uploadError } = await userClient.storage
      .from("pedagogical-documents")
      .upload(storagePath, fileContent);

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      throw new Error("Storage RLS prevented upload for owner");
    }
    console.log("✅ Upload successful (Storage RLS allows owner)");

    console.log("2. Testing Cross-User Storage Access...");
    const otherPath = `some-other-uuid/${crypto.randomUUID()}.pdf`;
    const { error: crossUploadError } = await userClient.storage
      .from("pedagogical-documents")
      .upload(otherPath, fileContent);
    
    if (!crossUploadError) {
      throw new Error("Storage RLS allowed cross-user upload");
    }
    console.log("✅ Cross-user upload denied");

    console.log("3. Testing DB Insert...");
    // Create a mock subject first
    const { data: subject, error: subErr } = await adminClient
      .from("subjects")
      .insert({
        name: "Test Subject",
        code: "TEST101",
        description: "Test",
        created_by: user.id
      })
      .select()
      .single();

    if (subErr) throw subErr;

    // Test DB RLS insert
    const docId = crypto.randomUUID();
    const { error: dbInsertError } = await userClient
      .from("documents")
      .insert({
        id: docId,
        subject_id: subject.id,
        storage_path: storagePath,
        provenance: "STUDENT",
        owner_id: user.id,
        status: "pending"
      });

    if (dbInsertError) {
      console.error("DB Insert failed:", dbInsertError);
      throw new Error("DB RLS prevented insert for owner");
    }
    console.log("✅ DB Insert successful (RLS allows owner to create STUDENT doc)");

    console.log("3.5 Testing Idempotence (Unique storage_path)...");
    const { error: doubleInsertError } = await userClient
      .from("documents")
      .insert({
        id: crypto.randomUUID(),
        subject_id: subject.id,
        storage_path: storagePath, // Same path
        provenance: "STUDENT",
        owner_id: user.id,
        status: "pending"
      });
      
    if (!doubleInsertError || doubleInsertError.code !== "23505") {
      throw new Error("Unique constraint failed to block duplicate storage_path");
    }
    console.log("✅ Idempotence: Duplicate storage_path blocked by DB unique constraint");

    console.log("4. Testing OFFICIAL spoofing...");
    const spoofId = crypto.randomUUID();
    const { error: spoofError } = await userClient
      .from("documents")
      .insert({
        id: spoofId,
        subject_id: subject.id,
        storage_path: storagePath,
        provenance: "OFFICIAL", // Should be blocked
        owner_id: user.id,
        status: "pending"
      });
    
    if (!spoofError) {
      throw new Error("DB RLS allowed creating OFFICIAL document by student");
    }
    console.log("✅ DB prevents spoofing OFFICIAL provenance");

    console.log("5. Testing Full Ingestion Pipeline...");
    // Since we are running outside Next.js, we mock the pipeline trigger
    const pipeline = new IngestionPipeline();
    await pipeline.processDocument(docId, user.id);
    console.log("✅ Ingestion Pipeline completed successfully");

    // Verify chunks exist
    const { count, error: countErr } = await adminClient
      .from("document_chunks")
      .select("*", { count: "exact", head: true })
      .eq("document_id", docId);
    
    if (countErr || !count || count === 0) {
      throw new Error("No chunks were generated by the ingestion pipeline");
    }
    console.log(`✅ Document successfully chunked (${count} chunks)`);

    console.log("6. Testing E2E RAG Retrieval (Isolation test)...");
    
    // Get the real embedding to guarantee a match
    const { data: chunkData } = await adminClient
      .from("document_chunks")
      .select("embedding")
      .eq("document_id", docId)
      .limit(1)
      .single();
      
    if (!chunkData || !chunkData.embedding) {
      throw new Error("Could not retrieve embedding for test");
    }
    
    // As User A
    const { data: searchUserA, error: searchErrA } = await userClient.rpc("match_document_chunks", {
      query_embedding: chunkData.embedding,
      match_threshold: 0.5,
      match_count: 5,
      filter_subject_id: subject.id
    });
    
    if (searchErrA) throw searchErrA;
    if (!searchUserA || searchUserA.length === 0) {
      throw new Error("User A could not retrieve their own STUDENT document chunks");
    }
    console.log("✅ User A successfully retrieved their STUDENT document via RAG RPC");

    // As User B
    const { data: userBAuth, error: authErrB } = await adminClient.auth.admin.createUser({
      email: `student_b_${Date.now()}@test.com`,
      password: "password123",
      email_confirm: true
    });
    if (authErrB) throw authErrB;
    const userB = userBAuth.user;

    const userBClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await userBClient.auth.signInWithPassword({ email: userB.email!, password: "password123" });

    const { data: searchUserB, error: searchErrB } = await userBClient.rpc("match_document_chunks", {
      query_embedding: chunkData.embedding,
      match_threshold: 0.5,
      match_count: 5,
      filter_subject_id: subject.id
    });
    
    if (searchErrB) throw searchErrB;
    if (searchUserB && searchUserB.length > 0) {
      throw new Error("User B was able to retrieve User A's STUDENT document chunks!");
    }
    console.log("✅ RAG Isolation: User B cannot retrieve User A's STUDENT document");

    await adminClient.auth.admin.deleteUser(userB.id);

  } finally {
    // Cleanup
    console.log("Cleaning up...");
    await adminClient.auth.admin.deleteUser(user.id);
  }
}

main().catch(console.error);

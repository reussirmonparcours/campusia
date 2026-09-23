import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { parse } from "dotenv";
import { IngestionPipeline } from "../src/lib/rag/pipeline";

// Load local env manually
const envPath = join(process.cwd(), ".env.local");
const envVars = parse(readFileSync(envPath));
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase configuration");
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey);
const pipeline = new IngestionPipeline({ useMockEmbeddings: false });

async function importKnowledge() {
  console.log("=== INSTITUTIONAL KNOWLEDGE IMPORT ===");
  const importDir = join(process.cwd(), "knowledge-import");
  
  let files: string[] = [];
  try {
    files = readdirSync(importDir).filter(f => f.endsWith(".pdf"));
  } catch (e) {
    console.log("No knowledge-import/ directory found or it's empty.");
    return;
  }

  if (files.length === 0) {
    console.log("No PDF files found in knowledge-import/");
    return;
  }

  // We need a target subject for these test docs.
  // We'll create a dummy 'Institution Subject' or use one if provided via args.
  const { data: subject } = await supabaseAdmin.from("subjects").insert({
    name: "Institutional Core Modules"
  }).select().single();

  const subjectId = subject.id;

  for (const file of files) {
    console.log(`\nProcessing file: ${file}`);
    const filePath = join(importDir, file);
    const fileBuffer = readFileSync(filePath);

    // 1. Upload to Storage
    const storagePath = `institutional/${Date.now()}-${file}`;
    console.log(`- Uploading to storage: ${storagePath}`);
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from("pedagogical-documents")
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf"
      });

    if (uploadError) {
      console.error(`- Upload failed: ${uploadError.message}`);
      continue;
    }

    // 2. Create document record
    console.log(`- Creating DB record`);
    const { data: doc, error: docError } = await supabaseAdmin.from("documents").insert({
      storage_path: storagePath,
      owner_id: null,
      subject_id: subjectId,
      provenance: "OFFICIAL",
      status: "pending",
      metadata: { original_filename: file }
    }).select().single();

    if (docError || !doc) {
      console.error(`- DB record creation failed:`, docError);
      continue;
    }

    // 3. Trigger Pipeline
    console.log(`- Triggering ingestion pipeline for doc ${doc.id}`);
    const result = await pipeline.processDocument(doc.id);
    
    if (result.success) {
      console.log(`- Success! Extracted ${result.pages} pages into ${result.chunks} chunks.`);
    } else {
      console.error(`- Pipeline failed: ${result.error}`);
    }
  }

  console.log("\n=== IMPORT COMPLETE ===");
}

importKnowledge();

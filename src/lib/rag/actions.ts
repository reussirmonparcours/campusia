"use server";

import { createClient } from "@/lib/supabase/server";
import { getStudentAcademicContext } from "@/lib/academic/context";
import { waitUntil } from "@vercel/functions";
import { IngestionPipeline } from "@/lib/rag/pipeline";

async function processDocumentSafely(documentId: string, userId: string) {
  try {
    const pipeline = new IngestionPipeline();
    // Re-verify status is pending inside pipeline processDocument for idempotence? 
    // The pipeline already handles idempotence, but let's just trigger it.
    await pipeline.processDocument(documentId, userId);
  } catch (error) {
    console.error(`Background ingestion failed for ${documentId}:`, error);
  }
}

export async function registerStudentDocument(
  storagePath: string,
  subjectId: string,
  type: string,
  originalName: string
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Verify subject authorization
  const context = await getStudentAcademicContext(user.id);
  if (!context) {
    throw new Error("Academic context not found");
  }

  const isAuthorized = context.progression.enrolledSubjects.some(s => s.id === subjectId);
  if (!isAuthorized) {
    throw new Error("Unauthorized subject access");
  }

  if (!storagePath.startsWith(`${user.id}/`)) {
    throw new Error("Path traversal detected");
  }

  const documentId = storagePath.split("/").pop()?.replace(".pdf", "");
  if (!documentId) {
    throw new Error("Invalid storage path");
  }

  const metadata = {
    file_name: originalName,
    document_type: type
  };

  // Insert the document with explicit try/catch for orphan cleanup
  let data;
  try {
    const result = await supabase
      .from("documents")
      .insert({
        id: documentId,
        owner_id: user.id,
        subject_id: subjectId,
        provenance: "STUDENT",
        storage_path: storagePath,
        status: "pending",
        metadata
      })
      .select()
      .single();

    if (result.error) throw result.error;
    data = result.data;
  } catch (err: any) {
    console.error("DB error registering document, cleaning up storage:", err);
    // Orphan cleanup
    await supabase.storage.from("pedagogical-documents").remove([storagePath]);
    
    if (err.code === "23505") { // Unique violation
      throw new Error("Ce document est déjà en cours de traitement.");
    }
    throw new Error("Failed to register document");
  }

  // Trigger async ingestion using Vercel waitUntil
  waitUntil(processDocumentSafely(data.id, user.id));

  return { success: true, document: data };
}

export async function deleteStudentDocument(documentId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Fetch first to get storage path and verify ownership
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !doc) {
    throw new Error("Document not found or access denied");
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("pedagogical-documents")
    .remove([doc.storage_path]);

  if (storageError) {
    console.error("Storage cleanup error:", storageError);
    // Proceed to delete DB record anyway to avoid orphan DB rows
  }

  // Delete from DB (cascade chunks)
  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("owner_id", user.id);

  if (dbError) {
    throw new Error("Failed to delete document record");
  }

  return { success: true };
}

export async function retryIngestion(documentId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Reset status to pending (only if failed and owned)
  const { data, error } = await supabase
    .from("documents")
    .update({ status: "pending" })
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .eq("status", "failed")
    .select()
    .single();

  if (error || !data) {
    throw new Error("Document cannot be retried or access denied");
  }

  // Trigger async ingestion using Vercel waitUntil
  waitUntil(processDocumentSafely(data.id, user.id));

  return { success: true };
}

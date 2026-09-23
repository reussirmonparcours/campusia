import { createClient } from "@supabase/supabase-js";

export interface RagDocument {
  id: string;
  storage_path: string;
  owner_id: string | null;
  subject_id: string;
  provenance: "OFFICIAL" | "STUDENT";
  status: "pending" | "processing" | "completed" | "failed";
  metadata: Record<string, unknown> | null;
}

export interface ChunkInsert {
  document_id: string;
  content: string;
  embedding: number[];
  page_number: number | null;
  chunk_index: number;
  metadata?: Record<string, unknown>;
}

export class KnowledgeRepo {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase env for KnowledgeRepo");
    }

    // Must use service role to bypass RLS for ingestion
    this.supabase = createClient(supabaseUrl, serviceKey);
  }

  async getDocument(id: string): Promise<RagDocument> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new Error(`Document not found: ${id}`);
    }
    
    return data as RagDocument;
  }

  async startProcessing(id: string) {
    const { data, error } = await this.supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", id)
      .eq("status", "pending")
      .select();
      
    if (error) throw new Error(`Failed to set processing status: ${error.message}`);
    if (!data || data.length === 0) {
      throw new Error(`Document ${id} is already processing or does not exist`);
    }
  }

  async failProcessing(id: string, metadata: Record<string, unknown>) {
    const { error } = await this.supabase
      .from("documents")
      .update({ status: "failed", metadata })
      .eq("id", id);
      
    if (error) console.error(`Failed to set failed status for doc ${id}:`, error);
  }

  async completeProcessing(id: string, metadata: Record<string, unknown>) {
    const { error } = await this.supabase
      .from("documents")
      .update({ status: "completed", metadata })
      .eq("id", id);
      
    if (error) throw new Error(`Failed to set completed status: ${error.message}`);
  }

  async deleteExistingChunks(documentId: string) {
    const { error } = await this.supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);
      
    if (error) {
      throw new Error(`Failed to clean old chunks: ${error.message}`);
    }
  }

  async insertChunks(chunks: ChunkInsert[]) {
    if (chunks.length === 0) return;

    // Batch insert chunks
    // Supabase JS will handle an array.
    const { error } = await this.supabase
      .from("document_chunks")
      .insert(chunks as unknown as Record<string, unknown>[]); // Type cast due to vector being number[] in SDK

    if (error) {
      throw new Error(`Failed to insert chunks: ${error.message}`);
    }
  }

  async downloadPdf(path: string): Promise<Buffer> {
    const { data, error } = await this.supabase
      .storage
      .from("pedagogical-documents")
      .download(path);

    if (error || !data) {
      throw new Error(`Failed to download PDF from storage: ${path}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

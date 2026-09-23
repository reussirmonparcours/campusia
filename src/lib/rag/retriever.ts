import { SupabaseClient } from "@supabase/supabase-js";
import { EmbeddingProvider } from "./embeddings/provider";
import { RagError } from "./errors";
import { SourceProvenance } from "@/types/ai";

export interface RetrieverOptions {
  topK?: number;
  matchThreshold?: number;
}

export interface RetrievedChunk {
  ref: string; // The REF_X
  documentId: string;
  chunkId: string;
  content: string;
  similarity: number;
  pageNumber: number | null;
  provenance: SourceProvenance;
  metadata: Record<string, unknown> | null;
}

export class Retriever {
  constructor(
    private supabase: SupabaseClient,
    private embeddingProvider: EmbeddingProvider
  ) {}

  /**
   * Validates if the user has access to the subject context.
   * A subject is authorized if:
   * 1. The user has a progress record for it (Official enrolled subject)
   * 2. The user created it (Open Mode private subject)
   */
  async validateSubjectAccess(subjectId: string, userId: string): Promise<boolean> {
    // Check if it's an Open Mode subject they created
    const { data: subjectData } = await this.supabase
      .from("subjects")
      .select("created_by")
      .eq("id", subjectId)
      .single();

    if (subjectData && subjectData.created_by === userId) {
      return true;
    }

    // Otherwise, check if they are enrolled (progress record exists)
    const { data: progressData } = await this.supabase
      .from("student_subject_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("subject_id", subjectId)
      .maybeSingle();

    return !!progressData;
  }

  /**
   * Checks if there are any accessible documents for the given subject.
   */
  async hasAnyDocuments(subjectId: string): Promise<boolean> {
    // Using RLS: it will only count documents the user is allowed to select.
    const { count, error } = await this.supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", subjectId);

    if (error) {
      console.error("Error counting documents:", error);
      return false;
    }

    return (count ?? 0) > 0;
  }

  async retrieve(
    query: string,
    subjectId: string,
    options?: RetrieverOptions
  ): Promise<RetrievedChunk[]> {
    const topK = options?.topK ?? 5;
    const matchThreshold = options?.matchThreshold ?? 0.75; // Default cosine similarity threshold

    // Embed query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.embeddingProvider.embed(query);
    } catch {
      throw new RagError("RAG_RETRIEVAL_FAILED", "Failed to embed query");
    }

    // Call RPC
    const { data, error } = await this.supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: topK * 2, // Fetch more for deduplication
      filter_subject_id: subjectId,
    });

    if (error) {
      console.error("RPC Error:", error);
      throw new RagError("RAG_RETRIEVAL_FAILED", `Failed to retrieve chunks: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Deduplication and formatting
    const results: RetrievedChunk[] = [];
    const seenChunks = new Set<string>();
    let refIndex = 1;

    for (const row of data) {
      // Deduplication based on chunk ID
      if (seenChunks.has(row.chunk_id)) continue;
      
      seenChunks.add(row.chunk_id);

      results.push({
        ref: `REF_${refIndex++}`,
        documentId: row.document_id,
        chunkId: row.chunk_id,
        content: row.content,
        similarity: row.similarity, // 1 - cosine_distance
        pageNumber: row.page_number,
        provenance: row.provenance as SourceProvenance,
        metadata: row.metadata,
      });

      if (results.length >= topK) {
        break;
      }
    }

    return results;
  }
}

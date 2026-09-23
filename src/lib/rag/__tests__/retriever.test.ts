import { describe, it, expect, vi, beforeEach } from "vitest";
import { Retriever } from "../retriever";
import { MockEmbeddingProvider } from "../embeddings/mock-provider";
import { RagError } from "../errors";
import { SupabaseClient } from "@supabase/supabase-js";

describe("Retriever", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabaseMock: any;
  let embeddingProvider: MockEmbeddingProvider;
  let retriever: Retriever;

  beforeEach(() => {
    supabaseMock = {
      rpc: vi.fn(),
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    };
    embeddingProvider = new MockEmbeddingProvider();
    retriever = new Retriever(supabaseMock as unknown as SupabaseClient, embeddingProvider);
  });

  it("should validate subject access (Open Mode)", async () => {
    supabaseMock.single.mockResolvedValue({ data: { created_by: "user-1" }, error: null });
    const isAuth = await retriever.validateSubjectAccess("subj-1", "user-1");
    expect(isAuth).toBe(true);
  });

  it("should validate subject access (Enrolled)", async () => {
    supabaseMock.single.mockResolvedValue({ data: null, error: null });
    supabaseMock.maybeSingle.mockResolvedValue({ data: { id: "prog-1" }, error: null });
    const isAuth = await retriever.validateSubjectAccess("subj-1", "user-1");
    expect(isAuth).toBe(true);
  });

  it("should reject subject access if not enrolled and not creator", async () => {
    supabaseMock.single.mockResolvedValue({ data: { created_by: "user-2" }, error: null });
    supabaseMock.maybeSingle.mockResolvedValue({ data: null, error: null });
    const isAuth = await retriever.validateSubjectAccess("subj-1", "user-1");
    expect(isAuth).toBe(false);
  });

  it("should return true for hasAnyDocuments if count > 0", async () => {
    supabaseMock.eq.mockResolvedValue({ count: 5, error: null });
    const hasDocs = await retriever.hasAnyDocuments("subj-1");
    expect(hasDocs).toBe(true);
  });

  it("should return false for hasAnyDocuments if count is 0", async () => {
    supabaseMock.eq.mockResolvedValue({ count: 0, error: null });
    const hasDocs = await retriever.hasAnyDocuments("subj-1");
    expect(hasDocs).toBe(false);
  });

  it("should retrieve chunks successfully and assign REFs", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: [
        {
          chunk_id: "chunk-1",
          document_id: "doc-1",
          content: "Official content 1",
          similarity: 0.9,
          page_number: 1,
          provenance: "OFFICIAL",
          metadata: {},
        },
      ],
      error: null,
    });

    const results = await retriever.retrieve("What is X?", "subj-1");

    expect(results).toHaveLength(1);
    expect(results[0].ref).toBe("REF_1");
  });
  it("should transmit default topK and matchThreshold to RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: [], error: null });

    await retriever.retrieve("What is X?", "subj-1");

    expect(supabaseMock.rpc).toHaveBeenCalledWith("match_document_chunks", expect.objectContaining({
      match_threshold: 0.75, // Default
      match_count: 10, // Default topK 5 * 2
      filter_subject_id: "subj-1"
    }));
  });

  it("should transmit custom topK and matchThreshold to RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: [], error: null });

    await retriever.retrieve("What is X?", "subj-1", { topK: 3, matchThreshold: 0.8 });

    expect(supabaseMock.rpc).toHaveBeenCalledWith("match_document_chunks", expect.objectContaining({
      match_threshold: 0.8,
      match_count: 6, // 3 * 2
      filter_subject_id: "subj-1"
    }));
  });

  it("should limit results to topK even if more are returned", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: [
        { chunk_id: "chunk-1", document_id: "doc-1", content: "c1", similarity: 0.9, page_number: 1, provenance: "OFFICIAL" },
        { chunk_id: "chunk-2", document_id: "doc-1", content: "c2", similarity: 0.85, page_number: 1, provenance: "OFFICIAL" },
        { chunk_id: "chunk-3", document_id: "doc-1", content: "c3", similarity: 0.8, page_number: 1, provenance: "OFFICIAL" }
      ],
      error: null,
    });

    // Requesting topK = 2
    const results = await retriever.retrieve("query", "subj-1", { topK: 2 });
    
    expect(results).toHaveLength(2);
    expect(results[0].chunkId).toBe("chunk-1");
    expect(results[1].chunkId).toBe("chunk-2");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContextBuilder } from "../context-builder";
import { Retriever, RetrievedChunk } from "../retriever";
import { RagError } from "../errors";
import { AIRequest } from "@/types/ai";

describe("ContextBuilder", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let retrieverMock: any;
  let contextBuilder: ContextBuilder;

  beforeEach(() => {
    retrieverMock = {
      retrieve: vi.fn(),
      validateSubjectAccess: vi.fn(),
      hasAnyDocuments: vi.fn(),
    };
    contextBuilder = new ContextBuilder(retrieverMock as unknown as Retriever);
  });

  const baseRequest: AIRequest = {
    mode: "explain",
    studentContext: {},
    userMessage: "What is X?",
    academicContext: {
      subjectId: "subj-1",
    },
  };

  it("should return empty if subjectId is missing", async () => {
    const request = { ...baseRequest, academicContext: {} };
    const { safeSources, internalMapping } = await contextBuilder.buildContext(request, "user-1");
    
    expect(safeSources).toEqual([]);
    expect(internalMapping).toEqual({});
    expect(retrieverMock.validateSubjectAccess).not.toHaveBeenCalled();
  });

  it("should throw RAG_NO_SOURCES if subject is unauthorized", async () => {
    retrieverMock.validateSubjectAccess.mockResolvedValue(false);

    await expect(contextBuilder.buildContext(baseRequest, "user-1")).rejects.toThrowError(RagError);
    await expect(contextBuilder.buildContext(baseRequest, "user-1")).rejects.toThrowError(/Je n'ai pas encore de document disponible/);
  });

  it("should throw RAG_NO_SOURCES if no documents exist", async () => {
    retrieverMock.validateSubjectAccess.mockResolvedValue(true);
    retrieverMock.hasAnyDocuments.mockResolvedValue(false);

    await expect(contextBuilder.buildContext(baseRequest, "user-1")).rejects.toThrowError(RagError);
    await expect(contextBuilder.buildContext(baseRequest, "user-1")).rejects.toThrowError(/Je n'ai pas encore de document disponible/);
  });

  it("should build SourceContext with proper labels and mapping", async () => {
    retrieverMock.validateSubjectAccess.mockResolvedValue(true);
    retrieverMock.hasAnyDocuments.mockResolvedValue(true);

    const chunks: RetrievedChunk[] = [
      {
        ref: "REF_1",
        documentId: "doc-1",
        chunkId: "chunk-1",
        content: "Official Definition",
        similarity: 0.9,
        pageNumber: 4,
        provenance: "OFFICIAL",
        metadata: null,
      },
    ];

    retrieverMock.retrieve.mockResolvedValue(chunks);

    const { safeSources, internalMapping } = await contextBuilder.buildContext(baseRequest, "user-1");

    expect(safeSources).toHaveLength(1);
    expect(safeSources[0].sourceLabel).toBe("Cours officiel - REF_1 (Page 4)");
    
    expect(internalMapping["REF_1"]).toBeDefined();
    expect(internalMapping["REF_1"].documentId).toBe("doc-1");
  });

  it("should throw RAG_INSUFFICIENT_CONTEXT if no chunks retrieved but docs exist", async () => {
    retrieverMock.validateSubjectAccess.mockResolvedValue(true);
    retrieverMock.hasAnyDocuments.mockResolvedValue(true);
    retrieverMock.retrieve.mockResolvedValue([]);

    await expect(contextBuilder.buildContext(baseRequest, "user-1")).rejects.toThrowError(RagError);
    await expect(contextBuilder.buildContext(baseRequest, "user-1")).rejects.toThrowError(/Je trouve des documents pour cette matière/);
  });
});

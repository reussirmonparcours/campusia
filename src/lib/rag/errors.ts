export type RagErrorCode = 
  | "RAG_NO_SOURCES"
  | "RAG_INSUFFICIENT_CONTEXT"
  | "RAG_RETRIEVAL_FAILED"
  | "RAG_CONTEXT_TOO_LARGE";

export class RagError extends Error {
  constructor(public code: RagErrorCode, message: string) {
    super(message);
    this.name = "RagError";
  }
}

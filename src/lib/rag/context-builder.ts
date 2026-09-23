import { AIRequest, ProviderSourceDocument } from "@/types/ai";
import { Retriever, RetrieverOptions, RetrievedChunk } from "./retriever";
import { RagError } from "./errors";

export interface ContextBuilderOptions extends RetrieverOptions {
  maxSources?: number;
}

export interface RagContext {
  safeSources: ProviderSourceDocument[];
  internalMapping: Record<string, RetrievedChunk>;
}

export class ContextBuilder {
  constructor(private retriever: Retriever) {}

  async buildContext(
    request: AIRequest,
    userId: string,
    options?: ContextBuilderOptions
  ): Promise<RagContext> {
    const subjectId = request.academicContext?.subjectId;

    if (!subjectId) {
      // Open mode or missing subject context. We cannot filter securely for now.
      // Return empty so it falls back to normal AI chat.
      return { safeSources: [], internalMapping: {} };
    }

    // 1. Server-side validation of subjectId
    const isAuthorized = await this.retriever.validateSubjectAccess(subjectId, userId);
    if (!isAuthorized) {
      // Silent fail or explicit error. We'll treat it as no sources available.
      throw new RagError(
        "RAG_NO_SOURCES",
        "Je n'ai pas encore de document disponible pour cette matière. Tu peux ajouter ton cours ou tes notes."
      );
    }

    const query = request.userMessage;
    if (!query || query.trim().length === 0) {
      return { safeSources: [], internalMapping: {} };
    }

    // 2. Distinguish NO_SOURCES vs INSUFFICIENT_CONTEXT
    const hasDocs = await this.retriever.hasAnyDocuments(subjectId);
    if (!hasDocs) {
      throw new RagError(
        "RAG_NO_SOURCES",
        "Je n'ai pas encore de document disponible pour cette matière. Tu peux ajouter ton cours ou tes notes."
      );
    }

    // 3. Retrieve chunks
    const chunks = await this.retriever.retrieve(query, subjectId, options);

    if (chunks.length === 0) {
      throw new RagError(
        "RAG_INSUFFICIENT_CONTEXT",
        "Je trouve des documents pour cette matière, mais ils ne contiennent pas suffisamment d'informations pertinentes pour répondre avec fiabilité."
      );
    }

    const maxSources = options?.maxSources ?? 10;
    const safeSources: ProviderSourceDocument[] = [];
    const internalMapping: Record<string, RetrievedChunk> = {};

    for (const chunk of chunks) {
      const pageStr = chunk.pageNumber ? ` (Page ${chunk.pageNumber})` : "";
      
      const docName = chunk.provenance === "OFFICIAL" ? "Cours officiel" : "Document étudiant";
      const sourceLabel = `${docName} - ${chunk.ref}${pageStr}`;
      
      safeSources.push({
        ref: chunk.ref,
        sourceLabel,
        content: chunk.content, // Content is treated as DATA, not instructions
        provenance: chunk.provenance,
      });

      internalMapping[chunk.ref] = chunk;

      if (safeSources.length >= maxSources) {
        break;
      }
    }

    return { safeSources, internalMapping };
  }
}

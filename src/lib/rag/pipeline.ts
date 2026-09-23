import { KnowledgeRepo } from "./knowledge-repo";
import { extractTextFromPdf } from "./extractor";
import { chunkDocument } from "./chunker";
import { EmbeddingProvider } from "./embeddings/provider";
import { OpenAIEmbeddingProvider } from "./embeddings/openai-provider";
import { MockEmbeddingProvider } from "./embeddings/mock-provider";

export interface PipelineOptions {
  useMockEmbeddings?: boolean;
}

export class IngestionPipeline {
  private repo: KnowledgeRepo;
  private embedProvider: EmbeddingProvider;

  constructor(options: PipelineOptions = {}) {
    this.repo = new KnowledgeRepo();
    
    if (options.useMockEmbeddings) {
      this.embedProvider = new MockEmbeddingProvider();
    } else {
      this.embedProvider = new OpenAIEmbeddingProvider();
    }
  }

  async processDocument(documentId: string, userId?: string) {
    try {
      // 1. Fetch document metadata
      const doc = await this.repo.getDocument(documentId);

      // Security check for STUDENT documents
      if (userId && doc.provenance === "STUDENT" && doc.owner_id !== userId) {
        throw new Error("Unauthorized to process this document");
      }

      // 2. Mark as processing
      await this.repo.startProcessing(documentId);

      // 3. Delete old chunks (Idempotence)
      await this.repo.deleteExistingChunks(documentId);

      // 4. Download PDF
      const pdfBuffer = await this.repo.downloadPdf(doc.storage_path);

      // 5. Extract Text
      const extractedDoc = await extractTextFromPdf(pdfBuffer);
      
      const newMetadata = { ...(doc.metadata || {}), pages: extractedDoc.pageCount } as Record<string, unknown>;

      // 6. Chunking
      const chunks = chunkDocument(extractedDoc, 800, 100);

      // 7. Embeddings
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await this.embedProvider.embedBatch(chunkTexts);

      // 8. Persist chunks
      const inserts = chunks.map((chunk, idx) => ({
        document_id: documentId,
        content: chunk.content,
        embedding: embeddings[idx],
        page_number: chunk.pageNumber,
        chunk_index: chunk.chunkIndex
      }));

      // In a real environment with thousands of chunks, we might batch this insert,
      // but for MVP, Supabase JS can handle a few hundred records in one go.
      await this.repo.insertChunks(inserts);

      // 9. Mark as completed
      newMetadata.chunk_count = inserts.length;
      await this.repo.completeProcessing(documentId, newMetadata);

      return { success: true, chunks: inserts.length, pages: extractedDoc.pageCount };

    } catch (error: unknown) {
      const err = error as Error;
      console.error(`Pipeline error for doc ${documentId}:`, err);
      
      let failMessage = err.message;
      if (err.message === "NO_EXTRACTABLE_TEXT") {
         failMessage = "Document contains no extractable text (possible scan)";
      }
      
      try {
        const doc = await this.repo.getDocument(documentId);
        const md = { ...(doc.metadata || {}), error: failMessage } as Record<string, unknown>;
        await this.repo.failProcessing(documentId, md);
      } catch (updateErr) {
        console.error("Critical: Could not update document to failed status", updateErr);
      }
      
      return { success: false, error: failMessage };
    }
  }
}

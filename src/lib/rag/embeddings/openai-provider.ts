import OpenAI from "openai";
import { EmbeddingProvider } from "./provider";

const EMBEDDING_BATCH_SIZE = 100;
const MAX_RETRIES = 3;

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAIEmbeddingProvider");
    }
    
    this.openai = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  }

  async embed(text: string): Promise<number[]> {
    const vectors = await this.embedBatch([text]);
    return vectors[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const allEmbeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
      const batchEmbeddings = await this.embedWithRetry(batch);
      allEmbeddings.push(...batchEmbeddings);
    }
    
    return allEmbeddings;
  }
  
  private async embedWithRetry(batch: string[], retries = MAX_RETRIES, delay = 1000): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: batch,
      });
      return response.data.map(d => d.embedding);
    } catch (error: unknown) {
      const err = error as Error;
      if (retries > 0) {
        console.warn(`OpenAI API Error: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        return this.embedWithRetry(batch, retries - 1, delay * 2);
      }
      throw new Error(`OpenAI Embeddings API Error after retries: ${err.message}`);
    }
  }
}

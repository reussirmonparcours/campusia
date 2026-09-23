export interface EmbeddingProvider {
  /**
   * Generates embedding for a single text.
   */
  embed(text: string): Promise<number[]>;

  /**
   * Generates embeddings for a batch of texts.
   * Returns an array of arrays of numbers (the vectors).
   */
  embedBatch(texts: string[]): Promise<number[][]>;
}

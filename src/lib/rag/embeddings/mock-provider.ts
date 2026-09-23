import { EmbeddingProvider } from "./provider";

export class MockEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    const vectors = await this.embedBatch([text]);
    return vectors[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // Return a fake 1536-dimensional vector for each text
    return texts.map(() => {
      const vector = new Array(1536).fill(0.01);
      vector[0] = 0.99; // just to make it a unit-ish vector
      return vector;
    });
  }
}

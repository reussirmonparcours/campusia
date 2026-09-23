import { chunkDocument } from "../chunker";
import { describe, it, expect } from "vitest";
import assert from "node:assert";

describe("Chunker", () => {
  it("should split text into chunks within maxTokens limit", () => {
    // Generate a long text
    const text = "A".repeat(4000); // 4000 chars roughly 1000 tokens
    const doc = { pages: [{ text, pageNumber: 1 }], pageCount: 1 };
    
    const chunks = chunkDocument(doc, 500, 100);
    
    // maxChars = 2000. 4000 chars should be 2 or 3 chunks.
    assert.ok(chunks.length > 1);
    assert.ok(chunks[0].content.length <= 2000);
    assert.strictEqual(chunks[0].chunkIndex, 0);
    assert.strictEqual(chunks[1].chunkIndex, 1);
  });

  it("should preserve page numbers", () => {
    const doc = {
      pages: [
        { text: "This is page 1.", pageNumber: 1 },
        { text: "This is page 2.", pageNumber: 2 }
      ],
      pageCount: 2
    };
    
    const chunks = chunkDocument(doc, 500, 100);
    
    assert.strictEqual(chunks.length, 2);
    assert.strictEqual(chunks[0].pageNumber, 1);
    assert.strictEqual(chunks[0].content, "This is page 1.");
    assert.strictEqual(chunks[1].pageNumber, 2);
    assert.strictEqual(chunks[1].content, "This is page 2.");
    assert.strictEqual(chunks[1].chunkIndex, 1);
  });

  it("should prefer paragraph breaks", () => {
    const doc = { pages: [{ text: "First paragraph.\n\nSecond paragraph.", pageNumber: null }], pageCount: 1 };
    const chunks = chunkDocument(doc, 5, 0); // very small token limit to force split
    
    // "First paragraph." = 16 chars. 5 tokens * 4 = 20 chars max.
    assert.strictEqual(chunks.length, 2);
    assert.strictEqual(chunks[0].content, "First paragraph.");
    assert.strictEqual(chunks[0].pageNumber, null);
    assert.strictEqual(chunks[1].content, "Second paragraph.");
  });
});

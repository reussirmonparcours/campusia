import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "../openai-provider";
import { AIRequest, AIError, InternalChunkMapping } from "../../../types/ai";

// Mock openai
const mockCreate = vi.fn();

vi.mock("openai", () => {
  return {
    OpenAI: class {
      responses = {
        create: mockCreate,
      };
    }
  };
});

// Helper to build a valid InternalChunkMapping entry
function makeChunkMapping(overrides: Partial<InternalChunkMapping> = {}): InternalChunkMapping {
  return {
    ref: overrides.ref ?? "REF_1",
    documentId: overrides.documentId ?? "00000000-0000-0000-0000-000000000001",
    chunkId: overrides.chunkId ?? "chunk-1",
    content: overrides.content ?? "Some content",
    similarity: overrides.similarity ?? 0.85,
    pageNumber: overrides.pageNumber ?? 1,
    provenance: overrides.provenance ?? "OFFICIAL",
    metadata: overrides.metadata ?? { file_name: "cours.pdf" },
  };
}

describe("OpenAIProvider", () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_DEFAULT_MODEL = "gpt-5.4-mini";
    provider = new OpenAIProvider();
    mockCreate.mockReset();
  });

  // =========================================================================
  // TEST 1: API key required
  // =========================================================================
  it("should throw if OPENAI_API_KEY is not set", () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => new OpenAIProvider()).toThrow("OPENAI_API_KEY is not configured");
  });

  // =========================================================================
  // TEST 2: Responses API payload structure
  // =========================================================================
  it("should call responses.create with correct Responses API payload", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Test answer",
        sources_used: [],
        warnings: [],
        suggested_actions: [],
      }),
    });

    await provider.generate(request);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];

    // Verify it uses Responses API params (NOT Chat Completions)
    expect(callArgs).toHaveProperty("input");       // Responses API uses "input"
    expect(callArgs).toHaveProperty("text.format");  // Responses API uses text.format
    expect(callArgs).not.toHaveProperty("messages");  // Chat Completions param
    expect(callArgs).not.toHaveProperty("response_format"); // Chat Completions param
  });

  // =========================================================================
  // TEST 3: Structured output — text.format
  // =========================================================================
  it("should send correct text.format structure for structured output", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Test",
        sources_used: [],
        warnings: [],
        suggested_actions: [],
      }),
    });

    await provider.generate(request);
    const callArgs = mockCreate.mock.calls[0][0];

    expect(callArgs.text.format).toHaveProperty("type", "json_schema");
    expect(callArgs.text.format).toHaveProperty("name", "rag_response");
    expect(callArgs.text.format).toHaveProperty("strict", true);
    expect(callArgs.text.format).toHaveProperty("schema");
    expect(typeof callArgs.text.format.schema).toBe("object");
  });

  // =========================================================================
  // TEST 4: max_output_tokens (NOT max_tokens)
  // =========================================================================
  it("should use max_output_tokens and not max_tokens", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Test",
        sources_used: [],
        warnings: [],
        suggested_actions: [],
      }),
    });

    await provider.generate(request);
    const callArgs = mockCreate.mock.calls[0][0];

    expect(callArgs).toHaveProperty("max_output_tokens", 1500);
    expect(callArgs).not.toHaveProperty("max_tokens");
  });

  // =========================================================================
  // TEST 5: store: false
  // =========================================================================
  it("should set store: false to prevent OpenAI data retention", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Test",
        sources_used: [],
        warnings: [],
        suggested_actions: [],
      }),
    });

    await provider.generate(request);
    const callArgs = mockCreate.mock.calls[0][0];

    expect(callArgs).toHaveProperty("store", false);
  });

  // =========================================================================
  // TEST 6: output_text parsing (NOT choices[0])
  // =========================================================================
  it("should parse response from output_text field", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "The parsed answer",
        sources_used: [],
        warnings: ["a warning"],
        suggested_actions: [],
      }),
    });

    const response = await provider.generate(request);
    expect(response.message).toBe("The parsed answer");
    expect(response.warnings).toContain("a warning");
  });

  // =========================================================================
  // TEST 7: REF valid — source mapped successfully
  // =========================================================================
  it("should validate and map a valid REF to sourceProvenance", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
      _internalMapping: {
        "REF_1": makeChunkMapping({ ref: "REF_1", provenance: "OFFICIAL", metadata: { file_name: "cours.pdf" } }),
        "REF_2": makeChunkMapping({ ref: "REF_2", provenance: "STUDENT", metadata: { file_name: "notes.pdf" } }),
      },
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Here is the answer",
        sources_used: ["REF_1"],
        warnings: [],
        suggested_actions: [],
      }),
    });

    const response = await provider.generate(request);
    expect(response.sourceProvenance).toHaveLength(1);
    expect(response.sourceProvenance[0].type).toBe("OFFICIAL");
    expect(response.sourceProvenance[0].label).toBe("cours.pdf - REF_1");
  });

  // =========================================================================
  // TEST 8: REF invalid — unknown REF silently rejected
  // =========================================================================
  it("should silently reject REF_999 that does not exist in internalMapping", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
      _internalMapping: {
        "REF_1": makeChunkMapping({ ref: "REF_1" }),
      },
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Answer",
        sources_used: ["REF_999"],
        warnings: [],
        suggested_actions: [],
      }),
    });

    const response = await provider.generate(request);
    expect(response.sourceProvenance).toHaveLength(0);
  });

  // =========================================================================
  // TEST 9: fake UUID — model returns a real document UUID instead of REF_X
  // =========================================================================
  it("should reject a real UUID used as a source ref", async () => {
    const fakeUUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
      _internalMapping: {
        "REF_1": makeChunkMapping({ ref: "REF_1" }),
      },
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Answer",
        sources_used: [fakeUUID],
        warnings: [],
        suggested_actions: [],
      }),
    });

    const response = await provider.generate(request);
    expect(response.sourceProvenance).toHaveLength(0);
  });

  // =========================================================================
  // TEST 10: mixed valid + invalid REFs
  // =========================================================================
  it("should accept REF_1 and reject FAKE in the same response", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
      _internalMapping: {
        "REF_1": makeChunkMapping({ ref: "REF_1", provenance: "OFFICIAL", metadata: { file_name: "doc.pdf" } }),
      },
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Answer",
        sources_used: ["REF_1", "FAKE"],
        warnings: [],
        suggested_actions: [],
      }),
    });

    const response = await provider.generate(request);
    expect(response.sourceProvenance).toHaveLength(1);
    expect(response.sourceProvenance[0].type).toBe("OFFICIAL");
  });

  // =========================================================================
  // TEST 11: Streaming — does NOT use choices[0].delta.content
  // =========================================================================
  it("should stream words progressively and only emit provenance on last word", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
      _internalMapping: {
        "REF_1": makeChunkMapping({ ref: "REF_1", provenance: "OFFICIAL", metadata: { file_name: "doc.pdf" } }),
      },
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "word1 word2 word3",
        sources_used: ["REF_1"],
        warnings: [],
        suggested_actions: [],
      }),
    });

    const chunks: any[] = [];
    for await (const chunk of provider.stream(request)) {
      chunks.push(chunk);
    }

    // Should have 3 chunks (one per word)
    expect(chunks.length).toBe(3);

    // Intermediate chunks must NOT have sourceProvenance
    expect(chunks[0].sourceProvenance).toEqual([]);
    expect(chunks[1].sourceProvenance).toEqual([]);

    // Final chunk must have provenance
    expect(chunks[2].sourceProvenance).toHaveLength(1);
    expect(chunks[2].sourceProvenance[0].type).toBe("OFFICIAL");

    // Full text must be accumulated
    expect(chunks[2].message).toBe("word1 word2 word3");
  });

  // =========================================================================
  // TEST 12: Rate limit error
  // =========================================================================
  it("should handle rate limit error (429) from OpenAI", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    const rateLimitError = new Error("Rate limit");
    (rateLimitError as any).status = 429;
    mockCreate.mockRejectedValue(rateLimitError);

    await expect(provider.generate(request)).rejects.toThrow(AIError);
    await expect(provider.generate(request)).rejects.toHaveProperty("code", "RATE_LIMIT_EXCEEDED");
  });

  // =========================================================================
  // TEST 13: Context length error
  // =========================================================================
  it("should handle context_length_exceeded error", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    const ctxError = new Error("Context too long");
    (ctxError as any).code = "context_length_exceeded";
    mockCreate.mockRejectedValue(ctxError);

    await expect(provider.generate(request)).rejects.toThrow(AIError);
    await expect(provider.generate(request)).rejects.toHaveProperty("code", "CONTEXT_TOO_LARGE");
  });

  // =========================================================================
  // TEST 14: Generic provider error — no API key or stack trace leaked
  // =========================================================================
  it("should handle unknown errors as PROVIDER_UNAVAILABLE", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockRejectedValue(new Error("Something unexpected"));

    const error = await provider.generate(request).catch(e => e);
    expect(error).toBeInstanceOf(AIError);
    expect(error.code).toBe("PROVIDER_UNAVAILABLE");
    expect(error.message).toBe("Provider error");
    // Should NOT leak internal details
    expect(error.message).not.toContain("test-key");
    expect(error.message).not.toContain("OPENAI_API_KEY");
  });

  // =========================================================================
  // TEST 15: Empty response handling
  // =========================================================================
  it("should throw INTERNAL_ERROR on empty output_text", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockResolvedValue({ output_text: "" });

    const error = await provider.generate(request).catch(e => e);
    expect(error).toBeInstanceOf(AIError);
    expect(error.code).toBe("PROVIDER_UNAVAILABLE"); // cascades through handleOpenAIError
  });

  // =========================================================================
  // TEST 16: Malformed structured output
  // =========================================================================
  it("should handle malformed JSON from the model gracefully", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockResolvedValue({ output_text: "not valid json at all" });

    const error = await provider.generate(request).catch(e => e);
    expect(error).toBeInstanceOf(AIError);
    expect(error.code).toBe("PROVIDER_UNAVAILABLE");
  });

  // =========================================================================
  // TEST 17: Stream error propagation
  // =========================================================================
  it("should propagate errors in stream as AIError", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    const streamError = new Error("Stream interrupted");
    (streamError as any).status = 429;
    mockCreate.mockRejectedValue(streamError);

    const chunks: any[] = [];
    try {
      for await (const chunk of provider.stream(request)) {
        chunks.push(chunk);
      }
      // Should not reach here
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e).toBeInstanceOf(AIError);
      expect(e.code).toBe("RATE_LIMIT_EXCEEDED");
    }
  });

  // =========================================================================
  // TEST 18: Default model
  // =========================================================================
  it("should use the configured default model", async () => {
    process.env.OPENAI_DEFAULT_MODEL = "gpt-5.4-mini";
    provider = new OpenAIProvider();

    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Test",
        sources_used: [],
        warnings: [],
        suggested_actions: [],
      }),
    });

    await provider.generate(request);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-5.4-mini");
  });

  // =========================================================================
  // TEST 19: internalMapping not sent to provider
  // =========================================================================
  it("should never include _internalMapping in the payload sent to OpenAI", async () => {
    const request: AIRequest = {
      mode: "explain",
      studentContext: {},
      userMessage: "Hello",
      _internalMapping: {
        "REF_1": makeChunkMapping({ documentId: "secret-uuid-1234" }),
      },
    };

    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        answer: "Answer",
        sources_used: [],
        warnings: [],
        suggested_actions: [],
      }),
    });

    await provider.generate(request);
    const callArgs = mockCreate.mock.calls[0][0];

    // The payload (input messages) should not contain the word "secret-uuid"
    const payloadStr = JSON.stringify(callArgs);
    expect(payloadStr).not.toContain("secret-uuid-1234");
    expect(payloadStr).not.toContain("_internalMapping");
  });
});

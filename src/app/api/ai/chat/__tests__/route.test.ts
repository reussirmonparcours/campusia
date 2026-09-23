import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}));

vi.mock("@/lib/ai/context", () => ({
  buildAIContext: vi.fn().mockResolvedValue({
    studentContext: { program: "Test" },
    academicContext: undefined,
    learningContext: undefined,
    learnerMemories: [],
    summary: undefined,
    recentHistory: []
  })
}));

// We mock dynamic imports to avoid initializing real RAG/OpenAI providers in route tests
vi.mock("@/lib/rag/retriever", () => ({ Retriever: class {} }));
vi.mock("@/lib/rag/context-builder", () => ({ 
  ContextBuilder: class {
    buildContext = vi.fn().mockResolvedValue({ safeSources: [], internalMapping: {} });
  } 
}));
vi.mock("@/lib/ai/openai-provider", () => ({
  OpenAIProvider: class {
    stream = async function* () {
      yield { message: "Hel", generatedBy: "AI" };
      yield { message: "Hello", generatedBy: "AI" };
      yield { message: "Hello world", generatedBy: "AI", sourceProvenance: [] }; // Final chunk
    }
  }
}));
vi.mock("@/lib/rag/embeddings/openai-provider", () => ({ OpenAIEmbeddingProvider: class {} }));

describe("API Route: /api/ai/chat", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: { getUser: vi.fn() },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn()
    };
    const { createClient } = require("@/lib/supabase/server");
    createClient.mockResolvedValue(mockSupabase);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeRequest = (body: any) => new Request("http://localhost/api/ai/chat", {
    method: "POST",
    body: JSON.stringify(body)
  });

  it("Test 2: Unauthenticated request rejected (401)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth failed") } as any);
    const res = await POST(makeRequest({ sessionId: "123", message: "Hi" }));
    expect(res.status).toBe(401);
  });

  it("Test 3/4: User A cannot use User B session (404)", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "userA" } }, error: null });
    // Simulate session not found (or belongs to user B)
    mockSupabase.single.mockResolvedValue({ data: null, error: new Error("Not found") });
    
    const res = await POST(makeRequest({ sessionId: "sessionB", message: "Hi" }));
    expect(res.status).toBe(404);
  });

  it("Test 1, 5, 6, 18: Authenticated user streams and persists", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "userA" } }, error: null });
    mockSupabase.single.mockResolvedValue({ data: { id: "session1", user_id: "userA", mode: "explain" }, error: null });
    mockSupabase.insert.mockResolvedValue({ error: null });

    const res = await POST(makeRequest({ sessionId: "session1", message: "Hi" }));
    
    // Check user message persisted
    expect(mockSupabase.insert).toHaveBeenCalledWith({ session_id: "session1", role: "user", content: "Hi" });
    
    // Check response is a stream
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    // Consume stream to trigger persistence of assistant message
    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }

    // After stream completes, the final assistant message should be persisted
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      session_id: "session1",
      role: "assistant",
      content: "Hello world",
      sources_used: null
    });
  });

  it("Test 7: Failed generation does not create fake completed message", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "userA" } }, error: null });
    mockSupabase.single.mockResolvedValue({ data: { id: "session1", user_id: "userA", mode: "explain" }, error: null });
    mockSupabase.insert.mockResolvedValue({ error: null }); // user msg insert succeeds

    // Override mock to throw error during stream
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OpenAIProvider } = require("@/lib/ai/openai-provider");
    OpenAIProvider.prototype.stream = async function* () {
      yield { message: "Hel", generatedBy: "AI" };
      throw new Error("Provider crashed");
    };

    const res = await POST(makeRequest({ sessionId: "session1", message: "Hi" }));
    const reader = res.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }

    // user message is inserted, but assistant message is NOT inserted because final chunk was never reached
    expect(mockSupabase.insert).toHaveBeenCalledTimes(1); 
    expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({ role: "user" }));
  });
});

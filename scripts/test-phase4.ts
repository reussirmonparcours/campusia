import test from "node:test";
import assert from "node:assert";
import { MockAIProvider } from "../src/lib/ai/mock-provider";
import { AIRequestSchema, AIResponseSchema, AIRequest, AIError } from "../src/types/ai";

test("Phase 4 Test Suite", async (t) => {
  const provider = new MockAIProvider();

  const validBaseRequest: AIRequest = {
    mode: "explain",
    studentContext: { level: "Master" },
    userMessage: "Test message",
  };

  await t.test("A. MockAIProvider - Generate explain", async () => {
    const res = await provider.generate(validBaseRequest);
    assert.strictEqual(res.mode, "explain");
    assert.strictEqual(res.generatedBy, "AI");
    assert.ok(res.message.includes("explication mockée"));
  });

  await t.test("A. MockAIProvider - Generate summarize", async () => {
    const res = await provider.generate({ ...validBaseRequest, mode: "summarize" });
    assert.ok(res.message.includes("résumé mocké"));
  });

  await t.test("A. MockAIProvider - Generate quiz", async () => {
    const res = await provider.generate({ ...validBaseRequest, mode: "quiz" });
    assert.ok(res.message.includes("Prêt pour un mini-quiz"));
  });

  await t.test("A. MockAIProvider - Generate coach", async () => {
    const res = await provider.generate({ ...validBaseRequest, mode: "coach" });
    assert.ok(res.message.includes("Travaillons ensemble"));
  });

  await t.test("A. MockAIProvider - Stream", async () => {
    const stream = provider.stream(validBaseRequest);
    let chunks = 0;
    for await (const chunk of stream) {
      if (chunks === 0) {
        assert.strictEqual(chunk.mode, "explain");
      }
      chunks++;
    }
    assert.ok(chunks > 1);
  });

  await t.test("B. AIRequest Validation - Valid request", () => {
    const res = AIRequestSchema.safeParse(validBaseRequest);
    assert.strictEqual(res.success, true);
  });

  await t.test("B. AIRequest Validation - Invalid mode", () => {
    const res = AIRequestSchema.safeParse({ ...validBaseRequest, mode: "invalid" });
    assert.strictEqual(res.success, false);
  });

  await t.test("B. AIRequest Validation - PII rejection", () => {
    const res = AIRequestSchema.safeParse({
      ...validBaseRequest,
      studentContext: { level: "Master", name: "John", email: "j@j.com" }
    });
    // Zod 'never' causes parsing to fail if the field is present
    assert.strictEqual(res.success, false);
  });

  await t.test("C. AIResponse Validation - Valid response", () => {
    const res = AIResponseSchema.safeParse({
      message: "Hello",
      mode: "explain",
      generatedBy: "AI",
      sourceProvenance: []
    });
    assert.strictEqual(res.success, true);
  });

  await t.test("C. AIResponse Validation - Invalid generatedBy", () => {
    const res = AIResponseSchema.safeParse({
      message: "Hello",
      mode: "explain",
      generatedBy: "Human", // Must be AI
      sourceProvenance: []
    });
    assert.strictEqual(res.success, false);
  });

  await t.test("E. Sécurité - AIError est sûre", () => {
    const error = new AIError("UNSAFE_CONTENT", "Format invalide");
    assert.strictEqual(error.code, "UNSAFE_CONTENT");
    assert.strictEqual(error.message, "Format invalide");
    assert.strictEqual(error.name, "AIError");
    // Ensure no stack traces are explicitly exposed in our manual properties
    assert.ok(!Object.keys(error).includes("stackTrace"));
  });
});

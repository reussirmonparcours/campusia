import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));

// Mock Supabase
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [{ id: "mock-user-id", email: "test@example.com" }] },
            error: null
          })
        }
      },
      rpc: vi.fn().mockResolvedValue({ data: { success: true, idempotent: false }, error: null })
    }))
  };
});

describe("Chariow Webhook Endpoint", () => {
  const secret = "test-secret-key-1234567890123456";

  beforeEach(() => {
    process.env.CHARIOW_PULSE_SECRET = secret;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-key";
  });

  function generateSignature(body: string, s = secret) {
    return crypto.createHmac('sha256', s).update(body, 'utf8').digest('hex');
  }

  function createRequest(bodyObj: Record<string, unknown>, customHeaders: Record<string, string> = {}) {
    const rawBody = JSON.stringify(bodyObj);
    const signature = generateSignature(rawBody);

    return new Request("http://localhost/api/webhooks/chariow", {
      method: "POST",
      headers: new Headers({
        "x-chariow-signature": signature,
        ...customHeaders
      }),
      body: rawBody
    });
  }

  it("should return 401 if signature is missing", async () => {
    const req = new Request("http://localhost/api/webhooks/chariow", {
      method: "POST",
      body: JSON.stringify({})
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 401 if signature is invalid", async () => {
    const req = createRequest({ event: "successful.sale" }, { "x-chariow-signature": "invalid-sig" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 if body is invalid JSON", async () => {
    const rawBody = "invalid-json";
    const sig = generateSignature(rawBody);
    const req = new Request("http://localhost/api/webhooks/chariow", {
      method: "POST",
      headers: { "x-chariow-signature": sig },
      body: rawBody
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should ignore events other than successful.sale", async () => {
    const req = createRequest({ event: "failed.sale" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ignored).toBe(true);
  });

  it("should return 200 and ignored for unknown product ID", async () => {
    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_123", amount: 2500, currency: "XOF" },
      product: { id: "unknown_prod" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ignored).toBe(true);
  });

  it("should return 400 for amount mismatch", async () => {
    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_123", amount: 1000, currency: "XOF" },
      product: { id: "prd_pc3t7rbj" } // ESSENTIAL_MONTHLY expects 2500
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Amount\/Currency mismatch/);
  });

  it("should process valid successful.sale correctly (via metadata)", async () => {
    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_123", amount: 2500, currency: "XOF" },
      product: { id: "prd_pc3t7rbj" },
      metadata: { monparcours_user_id: "mock-user-id" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("should process valid successful.sale correctly (via email fallback)", async () => {
    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_123", amount: 2500, currency: "XOF" },
      product: { id: "prd_pc3t7rbj" },
      customer: { email: "test@example.com" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("should resolve user even with different casing (Supabase: Jean@test.com, Chariow: jean@TEST.com)", async () => {
    vi.mocked(createClient).mockImplementationOnce(() => ({
      auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: "mock-user-id", email: "Jean@test.com" }] }, error: null }) } },
      rpc: vi.fn().mockResolvedValue({ data: { success: true, idempotent: false }, error: null })
    }) as unknown as ReturnType<typeof createClient>);

    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_case_123", amount: 2500, currency: "XOF" },
      product: { id: "prd_pc3t7rbj" },
      customer: { email: "jean@TEST.com" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("should resolve user even with whitespace (Supabase: ' Jean@test.com ', Chariow: 'jean@test.com')", async () => {
    vi.mocked(createClient).mockImplementationOnce(() => ({
      auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: "mock-user-id", email: " Jean@test.com " }] }, error: null }) } },
      rpc: vi.fn().mockResolvedValue({ data: { success: true, idempotent: false }, error: null })
    }) as unknown as ReturnType<typeof createClient>);

    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_space_123", amount: 2500, currency: "XOF" },
      product: { id: "prd_pc3t7rbj" },
      customer: { email: "jean@test.com" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("should return 200 and pending_resolution if user is not found", async () => {
    // Override the mock for this test only
    vi.mocked(createClient).mockImplementationOnce(() => ({
      auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }) } },
      rpc: vi.fn().mockResolvedValue({ data: { success: false, status: 'pending_resolution' }, error: null })
    }) as unknown as ReturnType<typeof createClient>);

    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_missing", amount: 2500, currency: "XOF" },
      product: { id: "prd_pc3t7rbj" },
      customer: { email: "unknown@example.com" }
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("pending_resolution");
  });

  it("should return 400 if sale.id is missing", async () => {
    const req = createRequest({
      event: "successful.sale",
      sale: { amount: 2500, currency: "XOF" },
      product: { id: "prd_pc3t7rbj" }
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Missing crucial sale data/);
  });

  it("should return 200 and idempotent=true when replaying same sale.id", async () => {
    vi.mocked(createClient).mockImplementationOnce(() => ({
      auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: "mock-user-id", email: "test@example.com" }] }, error: null }) } },
      rpc: vi.fn().mockResolvedValue({ data: { success: true, idempotent: true }, error: null })
    }) as unknown as ReturnType<typeof createClient>);

    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_replay_123", amount: 2500, currency: "XOF" },
      product: { id: "prd_pc3t7rbj" },
      customer: { email: "test@example.com" }
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.idempotent).toBe(true);
  });

  it("should process Essential Annual correctly", async () => {
    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_ess_ann", amount: 25000, currency: "XOF" },
      product: { id: "prd_yivr9uqv" },
      metadata: { monparcours_user_id: "mock-user-id" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("should process Complete Monthly correctly", async () => {
    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_comp_mo", amount: 3900, currency: "XOF" },
      product: { id: "prd_3ydderc8" },
      metadata: { monparcours_user_id: "mock-user-id" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("should process Complete Annual correctly", async () => {
    const req = createRequest({
      event: "successful.sale",
      sale: { id: "sale_comp_ann", amount: 39000, currency: "XOF" },
      product: { id: "prd_532k6ulo" },
      metadata: { monparcours_user_id: "mock-user-id" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

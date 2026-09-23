import { describe, it, expect, beforeEach, vi } from "vitest";
import { BillingRepository } from "../repository";
import { FeatureCode, UsageActionTypes } from "../types";

vi.mock("server-only", () => ({}));

// Mock Supabase Client
const createMockSupabase = () => {
  const rpcMock = vi.fn();
  
  return {
    rpc: rpcMock,
    rpcMock
  };
};

describe("BillingRepository", () => {
  let supabaseMock: ReturnType<typeof createMockSupabase>;
  let supabase: import("@supabase/supabase-js").SupabaseClient;

  beforeEach(() => {
    supabaseMock = createMockSupabase();
    supabase = supabaseMock as unknown as import("@supabase/supabase-js").SupabaseClient;
  });

  describe("reserveUsage", () => {
    it("should successfully reserve usage via RPC", async () => {
      supabaseMock.rpcMock.mockResolvedValue({
        data: {
          success: true,
          idempotent: false,
          ledger_id: 'ledger-123',
          granted: 150,
          used: 2,
          remaining: 148
        },
        error: null
      });

      const result = await BillingRepository.reserveUsage(
        supabase, 
        'AI_UNITS' as FeatureCode, 
        'req-123', 
        UsageActionTypes.AI_CHAT_RAG
      );

      expect(supabaseMock.rpcMock).toHaveBeenCalledWith('reserve_usage', {
        p_feature_code: 'AI_UNITS',
        p_request_id: 'req-123',
        p_action_type: UsageActionTypes.AI_CHAT_RAG,
        p_units: 2, // From weights
        p_metadata: {}
      });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(148);
    });

    it("should return insufficient quota error when RPC returns it", async () => {
      supabaseMock.rpcMock.mockResolvedValue({
        data: {
          success: false,
          error: 'INSUFFICIENT_QUOTA',
          granted: 150,
          used: 150,
          remaining: 0
        },
        error: null
      });

      const result = await BillingRepository.reserveUsage(
        supabase, 
        'AI_UNITS' as FeatureCode, 
        'req-124', 
        UsageActionTypes.AI_CHAT_RAG
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_QUOTA');
    });

    it("should handle idempotent requests safely", async () => {
      supabaseMock.rpcMock.mockResolvedValue({
        data: {
          success: true,
          idempotent: true,
          message: 'Already consumed'
        },
        error: null
      });

      const result = await BillingRepository.reserveUsage(
        supabase, 
        'AI_UNITS' as FeatureCode, 
        'req-123', 
        UsageActionTypes.AI_CHAT_RAG
      );

      expect(result.success).toBe(true);
      expect(result.idempotent).toBe(true);
    });
  });

  describe("commitUsage", () => {
    it("should call commit_usage RPC", async () => {
      supabaseMock.rpcMock.mockResolvedValue({
        data: { success: true, ledger_id: 'ledger-123' },
        error: null
      });

      const result = await BillingRepository.commitUsage(supabase, 'req-123');

      expect(supabaseMock.rpcMock).toHaveBeenCalledWith('commit_usage', {
        p_request_id: 'req-123',
        p_metadata: {}
      });
      expect(result.success).toBe(true);
    });
  });

  describe("releaseUsage", () => {
    it("should call release_usage RPC", async () => {
      supabaseMock.rpcMock.mockResolvedValue({
        data: { success: true, ledger_id: 'ledger-123' },
        error: null
      });

      const result = await BillingRepository.releaseUsage(supabase, 'req-123');

      expect(supabaseMock.rpcMock).toHaveBeenCalledWith('release_usage', {
        p_request_id: 'req-123'
      });
      expect(result.success).toBe(true);
    });
  });
});

import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { FeatureCode, ConsumeUsageResponse, BillingSubscription, BillingEntitlement, UsageActionTypes, USAGE_WEIGHTS } from "./types";

export class BillingRepository {
  /**
   * Retrieves active subscriptions for the given user.
   */
  static async getActiveSubscription(supabase: SupabaseClient, userId: string): Promise<BillingSubscription | null> {
    const { data, error } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .lte('current_period_start', new Date().toISOString())
      .or(`current_period_end.is.null,current_period_end.gte.${new Date().toISOString()}`)
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error("BillingRepository.getActiveSubscription error:", error);
      }
      return null;
    }

    return data as BillingSubscription;
  }

  /**
   * Retrieves the active entitlement for a specific feature.
   */
  static async getActiveEntitlement(supabase: SupabaseClient, userId: string, featureCode: FeatureCode): Promise<BillingEntitlement | null> {
    const { data, error } = await supabase
      .from('billing_entitlements')
      .select('*, billing_subscriptions!inner(status)')
      .eq('user_id', userId)
      .eq('feature_code', featureCode)
      .eq('billing_subscriptions.status', 'active')
      .lte('current_period_start', new Date().toISOString())
      .or(`current_period_end.is.null,current_period_end.gte.${new Date().toISOString()}`)
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error("BillingRepository.getActiveEntitlement error:", error);
      }
      return null;
    }

    return data as BillingEntitlement;
  }

  /**
   * Calculates granted, used, and remaining quota for an entitlement.
   * Note: This reads from the ledger. Consume operations should use the RPC.
   */
  static async getQuotaStatus(supabase: SupabaseClient, entitlementId: string, grantedValue: number) {
    const { data, error } = await supabase
      .from('billing_usage_ledger')
      .select('units')
      .eq('entitlement_id', entitlementId);

    if (error) {
      console.error("BillingRepository.getQuotaStatus error:", error);
      return { granted: grantedValue, used: 0, remaining: grantedValue };
    }

    // Since RESERVED is positive, COMMITTED is 0, RELEASED is negative
    const used = data.reduce((acc, curr) => acc + curr.units, 0);
    return {
      granted: grantedValue,
      used,
      remaining: Math.max(0, grantedValue - used)
    };
  }

  /**
   * Atomically reserves usage via the secure PostgreSQL RPC.
   */
  static async reserveUsage(
    supabase: SupabaseClient, 
    featureCode: FeatureCode,
    requestId: string,
    actionType: UsageActionTypes,
    metadata: Record<string, unknown> = {}
  ): Promise<ConsumeUsageResponse> {
    const units = USAGE_WEIGHTS[actionType];
    
    if (!units) {
      return { success: false, error: 'INVALID_ACTION_TYPE' };
    }

    const { data, error } = await supabase.rpc('reserve_usage', {
      p_feature_code: featureCode,
      p_request_id: requestId,
      p_action_type: actionType,
      p_units: units,
      p_metadata: metadata
    });

    if (error) {
      console.error("BillingRepository.reserveUsage RPC error:", error);
      return { success: false, error: error.message };
    }

    return data as ConsumeUsageResponse;
  }

  /**
   * Commits a successful usage generation.
   */
  static async commitUsage(supabase: SupabaseClient, requestId: string, metadata: Record<string, unknown> = {}): Promise<{ success: boolean; error?: string; idempotent?: boolean; message?: string }> {
    const { data, error } = await supabase.rpc('commit_usage', {
      p_request_id: requestId,
      p_metadata: metadata
    });

    if (error) {
      console.error("BillingRepository.commitUsage RPC error:", error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string; idempotent?: boolean; message?: string };
  }

  /**
   * Releases reserved usage (e.g., if generation fails).
   */
  static async releaseUsage(supabase: SupabaseClient, requestId: string): Promise<{ success: boolean; error?: string; idempotent?: boolean; message?: string }> {
    const { data, error } = await supabase.rpc('release_usage', {
      p_request_id: requestId
    });

    if (error) {
      console.error("BillingRepository.releaseUsage RPC error:", error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string; idempotent?: boolean; message?: string };
  }
}

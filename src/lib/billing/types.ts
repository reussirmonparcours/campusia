import { z } from "zod";

// Core Enums
export type BillingSubscriptionStatus = 'active' | 'pending' | 'past_due' | 'cancelled' | 'expired';
export type BillingInterval = 'one_off' | 'monthly' | 'annual';
export type BillingUsageStatus = 'RESERVED' | 'CONSUMED' | 'COMMITTED' | 'RELEASED' | 'REFUNDED';

// Action Types for Usage
export enum UsageActionTypes {
  AI_CHAT_SIMPLE = 'AI_CHAT_SIMPLE',
  AI_CHAT_RAG = 'AI_CHAT_RAG',
  AI_QUIZ = 'AI_QUIZ',
  AI_EXAM = 'AI_EXAM',
}

// Weights Configuration (Could be DB driven, but hardcoded abstract backend weights per Phase 2 rules)
export const USAGE_WEIGHTS: Record<UsageActionTypes, number> = {
  [UsageActionTypes.AI_CHAT_SIMPLE]: 1,
  [UsageActionTypes.AI_CHAT_RAG]: 2,
  [UsageActionTypes.AI_QUIZ]: 3,
  [UsageActionTypes.AI_EXAM]: 3,
};

export const UsageActionTypesSchema = z.nativeEnum(UsageActionTypes);

// Feature Codes
export type FeatureCode = 'AI_UNITS' | 'MAX_DOCUMENTS';

// Interfaces for DB tables
export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  currency: string;
  is_active: boolean;
}

export interface BillingSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: BillingSubscriptionStatus;
  billing_interval: BillingInterval;
  current_period_start: string;
  current_period_end: string | null;
  cancelled_at: string | null;
}

export interface BillingEntitlement {
  id: string;
  user_id: string;
  subscription_id: string;
  feature_code: FeatureCode;
  granted_value: number;
  current_period_start: string;
  current_period_end: string | null;
}

export interface BillingUsageLedger {
  id: string;
  user_id: string;
  subscription_id: string;
  entitlement_id: string;
  request_id: string;
  action_type: string;
  units: number;
  status: BillingUsageStatus;
  created_at: string;
}

// RPC Response Types
export interface ConsumeUsageResponse {
  success: boolean;
  idempotent?: boolean;
  message?: string;
  error?: string;
  ledger_id?: string;
  granted?: number;
  used?: number;
  remaining?: number;
}

// UI Presentation Types (Prepared for future UI)
export interface UIBillingSummary {
  planCode: string;
  planName: string;
  subscriptionStatus: BillingSubscriptionStatus;
  currentPeriodEnd: string | null;
  aiQuota: {
    granted: number;
    used: number;
    remaining: number;
  };
  documentQuota: {
    granted: number;
    used: number;
    remaining: number;
  };
}

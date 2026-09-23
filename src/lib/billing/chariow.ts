import "server-only";
import { z } from "zod";
import * as crypto from "crypto";
import { BillingInterval } from "./types";

export const CHARIOW_PRODUCTS = {
  ESSENTIAL_MONTHLY: 'prd_pc3t7rbj',
  ESSENTIAL_ANNUAL: 'prd_yivr9uqv',
  COMPLETE_MONTHLY: 'prd_3ydderc8',
  COMPLETE_ANNUAL: 'prd_532k6ulo',
} as const;

export interface ChariowPlanMapping {
  planCode: string;
  interval: BillingInterval;
  expectedAmount: number;
}

export function getPlanFromChariowProductId(productId: string): ChariowPlanMapping | null {
  switch (productId) {
    case CHARIOW_PRODUCTS.ESSENTIAL_MONTHLY:
      return { planCode: 'ESSENTIAL', interval: 'monthly', expectedAmount: 2500 };
    case CHARIOW_PRODUCTS.ESSENTIAL_ANNUAL:
      return { planCode: 'ESSENTIAL', interval: 'annual', expectedAmount: 25000 };
    case CHARIOW_PRODUCTS.COMPLETE_MONTHLY:
      return { planCode: 'COMPLETE', interval: 'monthly', expectedAmount: 3900 };
    case CHARIOW_PRODUCTS.COMPLETE_ANNUAL:
      return { planCode: 'COMPLETE', interval: 'annual', expectedAmount: 39000 };
    default:
      return null;
  }
}

// Support both flat structure and nested payload structure depending on Chariow's real payload
export const ChariowPulseSchema = z.object({
  event: z.string(),
  sale: z.object({
    id: z.string().optional(),
    amount: z.number(),
    currency: z.string(),
    status: z.string().optional(),
    custom_metadata: z.record(z.any()).optional().nullable()
  }).passthrough().optional(),
  product: z.object({
    id: z.string(),
    name: z.string().optional(),
    price: z.number().optional()
  }).passthrough().optional(),
  customer: z.object({
    id: z.string().optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable()
  }).passthrough().optional(),
  checkout: z.object({
    url: z.string().url().optional().nullable()
  }).passthrough().optional(),
  metadata: z.record(z.any()).optional().nullable(),
  payload: z.object({
    sale: z.object({
      id: z.string().optional(),
      amount: z.number(),
      currency: z.string(),
      status: z.string().optional(),
      custom_metadata: z.record(z.any()).optional().nullable()
    }).passthrough().optional(),
    product: z.object({
      id: z.string(),
      name: z.string().optional(),
      price: z.number().optional()
    }).passthrough().optional(),
    customer: z.object({
      id: z.string().optional(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable()
    }).passthrough().optional(),
    checkout: z.object({
      url: z.string().url().optional().nullable()
    }).passthrough().optional(),
    metadata: z.record(z.any()).optional().nullable()
  }).passthrough().optional()
}).passthrough();

export type ChariowPulsePayload = z.infer<typeof ChariowPulseSchema>;

export function extractChariowData(data: ChariowPulsePayload) {
  // Gracefully handle if nested in payload or flat at root
  const sale = data.sale || data.payload?.sale;
  const product = data.product || data.payload?.product;
  const customer = data.customer || data.payload?.customer;
  const metadata = data.metadata || data.payload?.metadata;

  return { sale, product, customer, metadata };
}

export function verifyChariowSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret || !rawBody) return false;
  try {
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    
    // Ensure both are the same length before timingSafeEqual to avoid errors
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expectedSignature, 'utf8');
    if (a.length !== b.length) return false;
    
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

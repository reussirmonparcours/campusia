import { NextResponse } from "next/server";
import { ChariowPulseSchema, verifyChariowSignature, extractChariowData, getPlanFromChariowProductId } from "../../../../lib/billing/chariow";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-chariow-signature");
    const secret = process.env.CHARIOW_PULSE_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 401 });
    }

    if (!verifyChariowSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let json;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validation = ChariowPulseSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
    }

    const data = validation.data;
    const { sale, product, customer, metadata } = extractChariowData(data);

    if (data.event !== "successful.sale") {
      // Ignorer sans erreur pour ne pas provoquer de retries inutiles
      return NextResponse.json({ received: true, ignored: true, reason: "Not a successful sale" }, { status: 200 });
    }

    if (!sale || !product || !sale.id || sale.amount === undefined || !sale.currency) {
      return NextResponse.json({ error: "Missing crucial sale data" }, { status: 400 });
    }

    const planMapping = getPlanFromChariowProductId(product.id);
    if (!planMapping) {
      console.warn(`[Chariow Webhook] Unknown product ID: ${product.id}`);
      // Return 200 because we don't want retries for a product we don't manage
      return NextResponse.json({ received: true, ignored: true, reason: "Unknown product ID" }, { status: 200 });
    }

    if (sale.amount !== planMapping.expectedAmount || sale.currency !== "XOF") {
      console.warn(`[Chariow Webhook] Amount mismatch. Expected ${planMapping.expectedAmount} XOF, got ${sale.amount} ${sale.currency}`);
      return NextResponse.json({ error: "Amount/Currency mismatch" }, { status: 400 });
    }

    // Identifier l'utilisateur
    let userId = metadata?.monparcours_user_id as string | undefined;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!userId && customer?.email) {
      // Stratégie 2 (Fallback documenté) : Résolution par email client
      // listUsers() est paginé, mais suffit pour un fallback tolérant
      const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!usersErr && usersData.users) {
        const normalizedCustomerEmail = customer.email.trim().toLowerCase();
        const match = usersData.users.find(u => (u.email ?? '').trim().toLowerCase() === normalizedCustomerEmail);
        if (match) {
          userId = match.id;
        }
      }
    }

    // pulse-delivery-id est conservé pour le logging et le diagnostic
    const pulseDeliveryId = req.headers.get("x-pulse-delivery-id");

    // Identifiant strict d'idempotence métier (sale.id)
    const providerEventId = sale.id;

    // Appel atomique via RPC, même si userId est manquant, pour conserver l'événement en pending_resolution
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("process_chariow_payment", {
      p_user_id: userId || null,
      p_provider_event_id: providerEventId,
      p_plan_code: planMapping.planCode,
      p_amount: sale.amount,
      p_currency: sale.currency,
      p_billing_interval: planMapping.interval,
      p_metadata: { ...metadata, pulse_delivery_id: pulseDeliveryId }
    });

    if (rpcError) {
      console.error("[Chariow Webhook] RPC Error:", rpcError);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    type RpcResponse = { success?: boolean; status?: string; idempotent?: boolean } | null;
    const result = rpcData as RpcResponse;

    if (result && !result.success && result.status === 'pending_resolution') {
      console.error(`[Chariow Webhook] Event saved but User not found for sale ${sale.id}. Email: ${customer?.email}`);
      return NextResponse.json({ received: true, status: "pending_resolution", reason: "User not identified" }, { status: 200 });
    }

    return NextResponse.json({ success: true, idempotent: result?.idempotent || false });

  } catch (err) {
    console.error("[Chariow Webhook] Fatal Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

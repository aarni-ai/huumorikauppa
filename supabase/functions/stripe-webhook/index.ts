import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "huumorikauppa@gmail.com";
const PRINTIFY_API = "https://api.printify.com/v1";

// Loose-typed to avoid PostgrestVersion generic friction across SDK minor versions
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// Log to webhook_logs table — never throws
async function logWebhook(
  supabase: SupabaseClient,
  params: {
    event_type: string;
    event_id?: string;
    stripe_session_id?: string;
    success: boolean;
    error_message?: string;
    raw_data?: Record<string, unknown>;
  },
) {
  try {
    await supabase.from("webhook_logs").insert(params);
  } catch (err) {
    console.error("Failed to write webhook_log:", err);
  }
}

// Log to email_logs table — never throws
async function logEmail(
  supabase: SupabaseClient,
  params: {
    order_id?: string;
    to_email: string;
    subject: string;
    status: "success" | "failed";
    error_message?: string;
    email_type: "customer" | "admin";
  },
) {
  try {
    await supabase.from("email_logs").insert(params);
  } catch (err) {
    console.error("Failed to write email_log:", err);
  }
}

// Send transactional email with one retry
async function sendEmailWithRetry(
  supabase: SupabaseClient,
  params: {
    templateName: string;
    recipientEmail: string;
    idempotencyKey: string;
    templateData: Record<string, unknown>;
    subject: string;
    orderId?: string;
    emailType: "customer" | "admin";
  },
): Promise<{ success: boolean; error?: string }> {
  const invoke = async () => {
    return await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: params.templateName,
        recipientEmail: params.recipientEmail,
        idempotencyKey: params.idempotencyKey,
        templateData: params.templateData,
      },
    });
  };

  // First attempt
  try {
    const { error } = await invoke();
    if (!error) {
      await logEmail(supabase, {
        order_id: params.orderId,
        to_email: params.recipientEmail,
        subject: params.subject,
        status: "success",
        email_type: params.emailType,
      });
      return { success: true };
    }
    console.warn(`Email send failed (attempt 1) for ${params.recipientEmail}:`, error.message);
  } catch (err) {
    console.warn(`Email send threw (attempt 1) for ${params.recipientEmail}:`, err);
  }

  // Retry once after 10s
  await new Promise((r) => setTimeout(r, 10_000));
  try {
    const { error } = await invoke();
    if (!error) {
      await logEmail(supabase, {
        order_id: params.orderId,
        to_email: params.recipientEmail,
        subject: params.subject,
        status: "success",
        email_type: params.emailType,
      });
      return { success: true };
    }
    const msg = error.message || "unknown error";
    await logEmail(supabase, {
      order_id: params.orderId,
      to_email: params.recipientEmail,
      subject: params.subject,
      status: "failed",
      error_message: `Retry failed: ${msg}`,
      email_type: params.emailType,
    });
    return { success: false, error: msg };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmail(supabase, {
      order_id: params.orderId,
      to_email: params.recipientEmail,
      subject: params.subject,
      status: "failed",
      error_message: `Retry threw: ${msg}`,
      email_type: params.emailType,
    });
    return { success: false, error: msg };
  }
}

async function sendOrderEmails(
  supabase: SupabaseClient,
  args: {
    customerEmail: string;
    customerName: string | null;
    items: OrderItem[];
    total: number;
    sessionId: string;
    orderId?: string;
    shippingAddress?: { address?: string; zip?: string; city?: string } | null;
  },
): Promise<{ customer: { success: boolean; error?: string } }> {
  const orderTotal = args.total.toFixed(2);

  // Customer confirmation
  const customerResult = await sendEmailWithRetry(supabase, {
    templateName: "order-confirmation",
    recipientEmail: args.customerEmail,
    idempotencyKey: `order-confirm-${args.sessionId}`,
    subject: "Tilausvahvistus – Huumorikauppa 🎉",
    orderId: args.orderId,
    emailType: "customer",
    templateData: {
      customerName: args.customerName || undefined,
      orderTotal,
      items: args.items,
      shippingAddress: args.shippingAddress || undefined,
    },
  });

  // Admin notification
  await sendEmailWithRetry(supabase, {
    templateName: "new-order-admin",
    recipientEmail: ADMIN_EMAIL,
    idempotencyKey: `order-admin-${args.sessionId}`,
    subject: `🚨 UUSI TILAUS HUUMORIKAUPPAAN – ${orderTotal} €`,
    orderId: args.orderId,
    emailType: "admin",
    templateData: {
      customerName: args.customerName || undefined,
      customerEmail: args.customerEmail,
      orderTotal,
      orderId: args.orderId,
      stripeSessionId: args.sessionId,
      shippingAddress: args.shippingAddress || undefined,
      items: args.items,
    },
  });

  return { customer: customerResult };
}

// =============================================================================
// Printify order submission
// =============================================================================

interface PrintifyLineItem {
  product_id: string;
  variant_id: number;
  quantity: number;
}

interface ShippingAddress {
  address?: string;
  zip?: string;
  city?: string;
}

async function submitPrintifyOrder(args: {
  externalId: string;
  label: string;
  lineItems: PrintifyLineItem[];
  customerName: string | null;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  countryIso?: string;
}): Promise<{ printifyOrderId: string }> {
  const apiKey = Deno.env.get("PRINTIFY_API_KEY");
  const shopId = Deno.env.get("PRINTIFY_SHOP_ID");
  if (!apiKey || !shopId) {
    throw new Error("Printify credentials missing (PRINTIFY_API_KEY / PRINTIFY_SHOP_ID)");
  }

  const fullName = (args.customerName || "Huumorikauppa Asiakas").trim();
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  const payload = {
    external_id: args.externalId,
    label: args.label,
    line_items: args.lineItems,
    shipping_method: 1, // 1 = standard
    is_printify_express: false,
    is_economy_shipping: false,
    send_shipping_notification: true,
    address_to: {
      first_name: firstName || "Asiakas",
      last_name: lastName,
      email: args.customerEmail,
      phone: "",
      country: args.countryIso || "FI",
      region: "",
      address1: args.shippingAddress.address || "",
      address2: "",
      city: args.shippingAddress.city || "",
      zip: args.shippingAddress.zip || "",
    },
  };

  const res = await fetch(`${PRINTIFY_API}/shops/${shopId}/orders.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* ignore */ }

  if (!res.ok) {
    throw new Error(
      `Printify API ${res.status}: ${text.slice(0, 500)}`,
    );
  }

  const printifyOrderId = data?.id || data?.order_id || "unknown";

  // Submit for production immediately (POST /orders/{id}/send_to_production.json)
  try {
    const prodRes = await fetch(
      `${PRINTIFY_API}/shops/${shopId}/orders/${printifyOrderId}/send_to_production.json`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    if (!prodRes.ok) {
      const prodTxt = await prodRes.text();
      console.warn(`Printify send_to_production warning [${prodRes.status}]: ${prodTxt.slice(0, 300)}`);
    }
  } catch (prodErr) {
    console.warn("Printify send_to_production threw:", prodErr);
  }

  return { printifyOrderId };
}

async function processCheckoutSession(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  const metadata = session.metadata || {};
  const shippingAddress = metadata.shipping_address
    ? JSON.parse(metadata.shipping_address)
    : null;
  const printifyItems: PrintifyLineItem[] = (() => {
    try {
      const raw = metadata.printify_items;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const customerEmail =
    session.customer_email || session.customer_details?.email || null;
  const customerName =
    metadata.customer_name || session.customer_details?.name || null;
  const total = (session.amount_total || 0) / 100;

  // Idempotency: check if order already exists
  const { data: existing } = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  let orderId: string | undefined;
  let items: OrderItem[] = [];

  if (existing) {
    orderId = existing.id as string;
    // Update status to paid (in case it was pending)
    await supabase
      .from("orders")
      .update({ status: "paid", payment_status: "paid" })
      .eq("stripe_session_id", session.id);

    // Try to fetch items for emails
    const { data: orderRow } = await supabase
      .from("orders")
      .select("items")
      .eq("id", orderId)
      .maybeSingle();
    if (orderRow?.items && Array.isArray(orderRow.items)) {
      items = orderRow.items as OrderItem[];
    }
  } else {
    // Fetch line items from Stripe
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
      });
      items = lineItems.data.map((li: any) => ({
        name: li.description || "Tuote",
        quantity: li.quantity || 1,
        price: (li.amount_total || 0) / 100 / (li.quantity || 1),
      }));
    } catch (err) {
      console.error("Failed to fetch line items:", err);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("orders")
      .insert({
        stripe_session_id: session.id,
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_address: shippingAddress,
        items,
        total,
        status: "paid",
        payment_status: "paid",
        printify_status: "pending",
        email_confirmation_status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (insertErr) {
      // Possibly a race — try to fetch by session id
      console.error("Order insert error:", insertErr);
      const { data: retry } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();
      orderId = retry?.id as string | undefined;
    } else {
      orderId = inserted?.id as string | undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // 1) Submit order to Printify (best-effort, fully isolated)
  // ---------------------------------------------------------------------------
  if (printifyItems.length > 0 && shippingAddress) {
    try {
      const { printifyOrderId } = await submitPrintifyOrder({
        externalId: orderId || session.id,
        label: `Huumorikauppa #${(orderId || session.id).slice(0, 8)}`,
        lineItems: printifyItems,
        customerName,
        customerEmail: customerEmail || "noreply@huumorikauppa.fi",
        shippingAddress: shippingAddress as ShippingAddress,
        countryIso: "FI",
      });
      if (orderId) {
        await supabase.from("orders").update({
          printify_status: "submitted",
          printify_order_id: printifyOrderId,
          printify_error: null,
        }).eq("id", orderId);
      }
      console.log(`Printify order created: ${printifyOrderId}`);
    } catch (printifyErr) {
      const msg = printifyErr instanceof Error ? printifyErr.message : String(printifyErr);
      console.error("Printify submission failed:", msg);
      if (orderId) {
        await supabase.from("orders").update({
          printify_status: "failed",
          printify_error: msg.slice(0, 1000),
        }).eq("id", orderId);
      }
      // Also log to webhook_logs for visibility
      await logWebhook(supabase, {
        event_type: "printify_submit_failed",
        stripe_session_id: session.id,
        success: false,
        error_message: msg,
        raw_data: { orderId, lineItemCount: printifyItems.length },
      });
    }
  } else if (orderId) {
    const reason = printifyItems.length === 0
      ? "no printify_items in metadata"
      : "no shipping address";
    await supabase.from("orders").update({
      printify_status: "skipped",
      printify_error: reason,
    }).eq("id", orderId);
    console.warn(`Skipping Printify submit: ${reason}`);
  }

  // ---------------------------------------------------------------------------
  // 2) Send confirmation emails (idempotency key prevents duplicates)
  // ---------------------------------------------------------------------------
  if (customerEmail) {
    try {
      const result = await sendOrderEmails(supabase, {
        customerEmail,
        customerName,
        items,
        total,
        sessionId: session.id,
        orderId,
        shippingAddress,
      });
      if (orderId) {
        await supabase.from("orders").update({
          email_confirmation_status: result.customer.success ? "sent" : "failed",
          email_error: result.customer.success ? null : (result.customer.error || "unknown").slice(0, 1000),
        }).eq("id", orderId);
      }
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error("Email send threw:", msg);
      if (orderId) {
        await supabase.from("orders").update({
          email_confirmation_status: "failed",
          email_error: msg.slice(0, 1000),
        }).eq("id", orderId);
      }
    }
  } else {
    console.warn(`No customer email for session ${session.id}`);
    if (orderId) {
      await supabase.from("orders").update({
        email_confirmation_status: "skipped",
        email_error: "no customer email",
      }).eq("id", orderId);
    }
  }

  return { orderId, customerEmail };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let event: Stripe.Event | null = null;
  let rawBody = "";

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (webhookSecret && sig) {
      try {
        event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
      } catch (verifyErr) {
        const msg = verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
        console.error("Signature verification failed:", msg);
        await logWebhook(supabase, {
          event_type: "signature_verification_failed",
          success: false,
          error_message: msg,
        });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // Dev fallback
      event = JSON.parse(rawBody) as Stripe.Event;
      console.warn("Webhook signature not verified (dev mode)");
    }

    console.log(`Stripe event: ${event.type} (${event.id})`);

    // Process checkout completion (primary path)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const result = await processCheckoutSession(supabase, stripe, session);
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          stripe_session_id: session.id,
          success: true,
          raw_data: { orderId: result.orderId, customerEmail: result.customerEmail },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("processCheckoutSession failed:", msg);
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          stripe_session_id: session.id,
          success: false,
          error_message: msg,
          raw_data: { sessionId: session.id },
        });
        // Re-throw so Stripe retries
        throw err;
      }
    }

    // Backup path: payment_intent.succeeded — find session and process if not already
    else if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: pi.id,
          limit: 1,
        });
        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          // Only process if no order yet
          const { data: existing } = await supabase
            .from("orders")
            .select("id, status")
            .eq("stripe_session_id", session.id)
            .maybeSingle();

          if (!existing || existing.status !== "paid") {
            const result = await processCheckoutSession(supabase, stripe, session);
            await logWebhook(supabase, {
              event_type: event.type,
              event_id: event.id,
              stripe_session_id: session.id,
              success: true,
              raw_data: { backup_path: true, orderId: result.orderId },
            });
          } else {
            await logWebhook(supabase, {
              event_type: event.type,
              event_id: event.id,
              stripe_session_id: session.id,
              success: true,
              raw_data: { skipped: "already processed" },
            });
          }
        } else {
          await logWebhook(supabase, {
            event_type: event.type,
            event_id: event.id,
            success: true,
            raw_data: { skipped: "no checkout session for payment_intent", payment_intent: pi.id },
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("payment_intent.succeeded handler failed:", msg);
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          success: false,
          error_message: msg,
        });
      }
    }

    // Refund handling
    else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      try {
        if (charge.payment_intent) {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: charge.payment_intent as string,
            limit: 1,
          });
          if (sessions.data.length > 0) {
            await supabase
              .from("orders")
              .update({ status: "cancelled" })
              .eq("stripe_session_id", sessions.data[0].id);
          }
        }
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          success: true,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          success: false,
          error_message: msg,
        });
      }
    }

    // Other events — just log
    else {
      await logWebhook(supabase, {
        event_type: event.type,
        event_id: event.id,
        success: true,
        raw_data: { handled: false },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook fatal error:", msg);
    await logWebhook(supabase, {
      event_type: event?.type || "unknown",
      event_id: event?.id,
      success: false,
      error_message: msg,
    });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

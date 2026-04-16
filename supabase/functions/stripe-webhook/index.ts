import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "info@huumorikauppa.fi";

type SupabaseClient = ReturnType<typeof createClient>;

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
) {
  const orderTotal = args.total.toFixed(2);

  // Customer confirmation
  await sendEmailWithRetry(supabase, {
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
      .update({ status: "paid" })
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
      items = lineItems.data.map((li) => ({
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

  // Send emails (always, even if order existed — idempotency key prevents duplicates)
  if (customerEmail) {
    await sendOrderEmails(supabase, {
      customerEmail,
      customerName,
      items,
      total,
      sessionId: session.id,
      orderId,
      shippingAddress,
    });
  } else {
    console.warn(`No customer email for session ${session.id}`);
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

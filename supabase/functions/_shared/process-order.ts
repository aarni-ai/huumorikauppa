// Shared order processing logic used by:
//   - stripe-webhook (primary path, signed events)
//   - get-order-by-session (self-healing on /tilaus-vahvistettu page)
//   - recover-orders (hourly cron sweep)
//
// Idempotent: safe to call multiple times for the same Stripe session.
// - If order already exists with status=paid AND printify_status=submitted
//   AND email_confirmation_status=sent, this is a no-op.
// - Otherwise it fills in any missing pieces.

import Stripe from "https://esm.sh/stripe@18.5.0";

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

const PRINTIFY_API = "https://api.printify.com/v1";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "huumorikauppa@gmail.com";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface PrintifyLineItem {
  product_id: string;
  variant_id: number;
  quantity: number;
}

interface ShippingAddress {
  address?: string;
  zip?: string;
  city?: string;
  country?: string;
}

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
  // We call send-transactional-email directly via fetch (not via
  // supabase.functions.invoke) because that helper does not always include
  // the service_role key in the Authorization header — and the function is
  // verify_jwt=true, which would reject anonymous calls with 401.
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const url = `${supabaseUrl}/functions/v1/send-transactional-email`;

  const callOnce = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({
          templateName: params.templateName,
          recipientEmail: params.recipientEmail,
          idempotencyKey: params.idempotencyKey,
          templateData: params.templateData,
        }),
      });
      if (res.ok) return { ok: true };
      const text = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  let attempt = await callOnce();
  if (!attempt.ok) {
    console.warn(`Email send attempt 1 failed for ${params.recipientEmail}: ${attempt.error}`);
    await new Promise((r) => setTimeout(r, 5_000));
    attempt = await callOnce();
  }

  if (attempt.ok) {
    await logEmail(supabase, {
      order_id: params.orderId,
      to_email: params.recipientEmail,
      subject: params.subject,
      status: "success",
      email_type: params.emailType,
    });
    return { success: true };
  }

  await logEmail(supabase, {
    order_id: params.orderId,
    to_email: params.recipientEmail,
    subject: params.subject,
    status: "failed",
    error_message: `Retry failed: ${attempt.error}`,
    email_type: params.emailType,
  });
  return { success: false, error: attempt.error };
}

// Keep this stub for diff cleanliness — old code below was removed.
async function _unused_legacy(supabase: SupabaseClient): Promise<void> {
  if (!supabase) return;
}

// (legacy function removed — direct fetch implementation above replaces it)

// The lines below were the tail of the old retry block; they are no longer
// reachable but stay as a comment for git history clarity.
/*
      await logEmail(supabase, {
        order_id: params.orderId,
        to_email: params.recipientEmail,
        subject: params.subject,
        status: "success",
        email_type: params.emailType,
      });
      return { success: true };
    }
*/

async function submitPrintifyOrder(args: {
  externalId: string;
  label: string;
  lineItems: PrintifyLineItem[];
  customerName: string | null;
  customerEmail: string;
  shippingAddress: ShippingAddress;
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
    shipping_method: 1,
    is_printify_express: false,
    is_economy_shipping: false,
    send_shipping_notification: true,
    address_to: {
      first_name: firstName || "Asiakas",
      last_name: lastName,
      email: args.customerEmail,
      phone: "",
      country: args.shippingAddress.country || "FI",
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
    throw new Error(`Printify API ${res.status}: ${text.slice(0, 500)}`);
  }

  const printifyOrderId = data?.id || data?.order_id || "unknown";

  // Send to production immediately
  try {
    const prodRes = await fetch(
      `${PRINTIFY_API}/shops/${shopId}/orders/${printifyOrderId}/send_to_production.json`,
      { method: "POST", headers: { Authorization: `Bearer ${apiKey}` } },
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

/**
 * Try to derive Printify line items from the order rows in the database.
 * Falls back when Stripe metadata didn't carry printify_items (e.g., old
 * orders, or checkout was created before Printify sync was finished).
 *
 * Matches order items by product name + size + color against the products table.
 */
async function derivePrintifyItemsFromOrder(
  supabase: SupabaseClient,
  items: OrderItem[],
): Promise<PrintifyLineItem[]> {
  if (!items.length) return [];
  const names = Array.from(new Set(items.map((i) => i.name).filter(Boolean)));
  if (!names.length) return [];

  const { data: prods } = await supabase
    .from("products")
    .select("name, printify_product_id, variants")
    .in("name", names);

  if (!prods || !prods.length) return [];

  const byName = new Map<string, any>();
  for (const p of prods) byName.set(p.name, p);

  const out: PrintifyLineItem[] = [];
  for (const it of items) {
    const prod = byName.get(it.name);
    if (!prod || !prod.printify_product_id) continue;
    const variantMap = prod?.variants?.variant_map as Record<string, number> | undefined;
    if (!variantMap) continue;
    // Stripe line item description we set: "Koko: <size>, Väri: <color>"
    const desc = (it as any).description as string | undefined;
    let size = "";
    let color = "";
    if (desc) {
      const sizeMatch = desc.match(/Koko:\s*([^,]+)/i);
      const colorMatch = desc.match(/Väri:\s*([^,]+)/i);
      if (sizeMatch) size = sizeMatch[1].trim();
      if (colorMatch) color = colorMatch[1].trim();
    }
    const key = `${color}|${size}`;
    const variantId = variantMap[key];
    if (typeof variantId === "number") {
      out.push({
        product_id: prod.printify_product_id,
        variant_id: variantId,
        quantity: it.quantity,
      });
    }
  }
  return out;
}

/**
 * Idempotent processor for a Stripe checkout session.
 * - Inserts the order row if missing
 * - Submits to Printify if not already submitted
 * - Sends customer + admin emails if not already sent
 */
export async function processCheckoutSession(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{
  orderId?: string;
  customerEmail: string | null;
  newlyCreated: boolean;
  printifyResult: "submitted" | "skipped" | "failed" | "already";
  emailResult: "sent" | "skipped" | "failed" | "already";
}> {
  const metadata = session.metadata || {};
  const shippingAddress: ShippingAddress | null = metadata.shipping_address
    ? JSON.parse(metadata.shipping_address)
    : null;
  const metaPrintifyItems: PrintifyLineItem[] = (() => {
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

  // 1) Look up or insert order
  const { data: existing } = await supabase
    .from("orders")
    .select("id, status, printify_status, email_confirmation_status, items, customer_email, shipping_address, customer_name")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  let orderId: string | undefined;
  let items: OrderItem[] = [];
  let newlyCreated = false;
  let existingPrintifyStatus: string | null = null;
  let existingEmailStatus: string | null = null;
  let effectiveCustomerEmail = customerEmail;
  let effectiveCustomerName = customerName;
  let effectiveShipping = shippingAddress;

  if (existing) {
    orderId = existing.id as string;
    items = Array.isArray(existing.items) ? (existing.items as OrderItem[]) : [];
    existingPrintifyStatus = existing.printify_status as string;
    existingEmailStatus = existing.email_confirmation_status as string;
    effectiveCustomerEmail = effectiveCustomerEmail || (existing.customer_email as string | null);
    effectiveCustomerName = effectiveCustomerName || (existing.customer_name as string | null);
    effectiveShipping = effectiveShipping || (existing.shipping_address as ShippingAddress | null);

    // Ensure status is paid
    await supabase
      .from("orders")
      .update({ status: "paid", payment_status: "paid" })
      .eq("id", orderId);
  } else {
    // Fetch line items from Stripe
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      items = lineItems.data.map((li: any) => ({
        name: li.description || "Tuote",
        quantity: li.quantity || 1,
        price: (li.amount_total || 0) / 100 / (li.quantity || 1),
      }));
    } catch (err) {
      console.error("Failed to fetch Stripe line items:", err);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("orders")
      .insert({
        stripe_session_id: session.id,
        customer_email: effectiveCustomerEmail,
        customer_name: effectiveCustomerName,
        shipping_address: effectiveShipping,
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
      console.error("Order insert error (race?):", insertErr);
      const { data: retry } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();
      orderId = retry?.id as string | undefined;
    } else {
      orderId = inserted?.id as string | undefined;
      newlyCreated = true;
    }
  }

  // 2) Printify submit (skip if already submitted)
  let printifyResult: "submitted" | "skipped" | "failed" | "already" = "skipped";
  if (existingPrintifyStatus === "submitted") {
    printifyResult = "already";
  } else {
    let printifyItems = metaPrintifyItems;
    if (printifyItems.length === 0 && items.length > 0) {
      // Try to derive from DB (e.g. for orders placed before Printify sync)
      printifyItems = await derivePrintifyItemsFromOrder(supabase, items);
    }

    if (printifyItems.length > 0 && effectiveShipping) {
      try {
        const { printifyOrderId } = await submitPrintifyOrder({
          externalId: orderId || session.id,
          label: `Huumorikauppa #${(orderId || session.id).slice(0, 8)}`,
          lineItems: printifyItems,
          customerName: effectiveCustomerName,
          customerEmail: effectiveCustomerEmail || "noreply@huumorikauppa.fi",
          shippingAddress: effectiveShipping,
        });
        if (orderId) {
          await supabase.from("orders").update({
            printify_status: "submitted",
            printify_order_id: printifyOrderId,
            printify_error: null,
          }).eq("id", orderId);
        }
        printifyResult = "submitted";
      } catch (printifyErr) {
        const msg = printifyErr instanceof Error ? printifyErr.message : String(printifyErr);
        console.error("Printify submission failed:", msg);
        if (orderId) {
          await supabase.from("orders").update({
            printify_status: "failed",
            printify_error: msg.slice(0, 1000),
          }).eq("id", orderId);
        }
        printifyResult = "failed";
      }
    } else if (orderId) {
      const reason = printifyItems.length === 0
        ? "no printify_items in metadata or DB"
        : "no shipping address";
      await supabase.from("orders").update({
        printify_status: "skipped",
        printify_error: reason,
      }).eq("id", orderId);
      printifyResult = "skipped";
    }
  }

  // 3) Customer email (skip if already sent)
  let emailResult: "sent" | "skipped" | "failed" | "already" = "skipped";
  if (existingEmailStatus === "sent") {
    emailResult = "already";
  } else if (effectiveCustomerEmail) {
    const orderTotal = total.toFixed(2);
    try {
      const customerRes = await sendEmailWithRetry(supabase, {
        templateName: "order-confirmation",
        recipientEmail: effectiveCustomerEmail,
        idempotencyKey: `order-confirm-${session.id}`,
        subject: "Tilausvahvistus – Huumorikauppa 🎉",
        orderId,
        emailType: "customer",
        templateData: {
          customerName: effectiveCustomerName || undefined,
          orderTotal,
          items,
          shippingAddress: effectiveShipping || undefined,
        },
      });

      // Admin notification (best-effort)
      await sendEmailWithRetry(supabase, {
        templateName: "new-order-admin",
        recipientEmail: ADMIN_EMAIL,
        idempotencyKey: `order-admin-${session.id}`,
        subject: `🚨 UUSI TILAUS HUUMORIKAUPPAAN – ${orderTotal} €`,
        orderId,
        emailType: "admin",
        templateData: {
          customerName: effectiveCustomerName || undefined,
          customerEmail: effectiveCustomerEmail,
          orderTotal,
          orderId,
          stripeSessionId: session.id,
          shippingAddress: effectiveShipping || undefined,
          items,
        },
      });

      if (orderId) {
        await supabase.from("orders").update({
          email_confirmation_status: customerRes.success ? "sent" : "failed",
          email_error: customerRes.success ? null : (customerRes.error || "unknown").slice(0, 1000),
        }).eq("id", orderId);
      }
      emailResult = customerRes.success ? "sent" : "failed";
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error("Email send threw:", msg);
      if (orderId) {
        await supabase.from("orders").update({
          email_confirmation_status: "failed",
          email_error: msg.slice(0, 1000),
        }).eq("id", orderId);
      }
      emailResult = "failed";
    }
  } else if (orderId) {
    await supabase.from("orders").update({
      email_confirmation_status: "skipped",
      email_error: "no customer email",
    }).eq("id", orderId);
    emailResult = "skipped";
  }

  return {
    orderId,
    customerEmail: effectiveCustomerEmail,
    newlyCreated,
    printifyResult,
    emailResult,
  };
}
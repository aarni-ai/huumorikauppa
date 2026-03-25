import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type } = await req.json();

    if (!email) throw new Error("Email is required");

    const storeEmail = "huumorikauppa@gmail.com";

    // Use Lovable AI to format a nice notification
    let subject = "";
    let body = "";

    if (type === "newsletter") {
      subject = `Uusi uutiskirjeen tilaaja: ${email}`;
      body = `Hei!\n\nUusi asiakas on liittynyt uutiskirjeelle:\n\nSähköposti: ${email}\nAika: ${new Date().toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" })}\n\nTerveisin,\nHuumorikauppa-järjestelmä`;
    } else if (type === "order") {
      subject = `Uusi tilaus vastaanotettu!`;
      body = `Hei!\n\nUusi tilaus on saapunut.\n\nAsiakkaan sähköposti: ${email}\nAika: ${new Date().toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" })}\n\nTarkista tilauksen tiedot Stripe-hallintapaneelista.\n\nTerveisin,\nHuumorikauppa-järjestelmä`;
    }

    // Send email notification via a simple SMTP-free approach
    // For Gmail notifications, we'll use the Supabase built-in email or a webhook
    // Since we don't have SMTP configured, we'll log and store the notification
    console.log(`Notification to ${storeEmail}: ${subject}`);
    console.log(body);

    return new Response(JSON.stringify({ success: true, message: "Notification logged" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Notify error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

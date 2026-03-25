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
    const { email } = await req.json();
    if (!email) throw new Error("Email is required");

    // Send notification to store owner via a simple fetch to a Gmail-compatible SMTP relay
    // For now, we log the subscriber and the owner can check the newsletter_subscribers table
    // A proper solution would use a transactional email service
    
    console.log(`New newsletter subscriber: ${email}`);
    console.log(`Notification should be sent to: huumorikauppa@gmail.com`);

    return new Response(
      JSON.stringify({ success: true, message: "Subscriber saved" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Newsletter notify error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

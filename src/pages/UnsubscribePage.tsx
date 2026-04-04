import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === true) setStatus("valid");
        else if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container py-20 text-center max-w-lg mx-auto space-y-6">
      <SEOHead title="Peruuta tilaus – Huumorikauppa" description="Peruuta sähköpostitilaus" noindex />

      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground">Tarkistetaan...</p>
        </>
      )}

      {status === "valid" && (
        <>
          <AlertCircle className="h-12 w-12 text-primary mx-auto" />
          <h1 className="font-display text-2xl text-foreground">Haluatko peruuttaa sähköpostitilauksen?</h1>
          <p className="text-muted-foreground">Et saa enää sähköpostiviestejä Huumorikaupasta.</p>
          <Button
            onClick={handleUnsubscribe}
            disabled={processing}
            className="bg-destructive text-destructive-foreground font-bold"
          >
            {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Käsitellään...</> : "Peruuta tilaus"}
          </Button>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h1 className="font-display text-2xl text-foreground">Tilaus peruutettu ✅</h1>
          <p className="text-muted-foreground">Et saa enää sähköpostiviestejä.</p>
        </>
      )}

      {status === "already" && (
        <>
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="font-display text-2xl text-foreground">Jo peruutettu</h1>
          <p className="text-muted-foreground">Tämä sähköpostitilaus on jo peruutettu aiemmin.</p>
        </>
      )}

      {status === "invalid" && (
        <>
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="font-display text-2xl text-foreground">Virheellinen linkki</h1>
          <p className="text-muted-foreground">Tämä peruutuslinkki ei ole voimassa.</p>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="font-display text-2xl text-foreground">Virhe</h1>
          <p className="text-muted-foreground">Jokin meni pieleen. Yritä myöhemmin uudelleen.</p>
        </>
      )}
    </div>
  );
};

export default UnsubscribePage;
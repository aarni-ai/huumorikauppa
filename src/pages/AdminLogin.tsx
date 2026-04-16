import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      // Defer role check to avoid deadlock
      setTimeout(async () => {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (data && mounted) navigate("/admin", { replace: true });
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) {
        setChecking(false);
        return;
      }
      if (session) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (data) {
          navigate("/admin", { replace: true });
          return;
        }
      }
      setChecking(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Kirjautuminen epäonnistui", description: error.message, variant: "destructive" });
    }
  };

  if (checking) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-16 md:py-24 max-w-md mx-auto">
      <SEOHead title="Admin-kirjautuminen – Huumorikauppa" description="Huumorikaupan admin-paneeli." noindex />
      <div className="bg-card border border-border rounded-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <Lock className="h-10 w-10 text-primary mx-auto" />
          <h1 className="font-display text-2xl text-foreground">Admin-kirjautuminen</h1>
          <p className="text-sm text-muted-foreground">Vain Huumorikaupan ylläpidolle.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground">Sähköposti</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-muted border-border mt-1" />
          </div>
          <div>
            <Label htmlFor="password" className="text-foreground">Salasana</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-muted border-border mt-1" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-bold">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kirjaudutaan…</> : "Kirjaudu sisään"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Mail, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "huumorikauppa-newsletter-dismissed";
const DELAY_MS = 20000;

export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Tarkista sähköpostiosoite", variant: "destructive" });
      return;
    }
    
    // Save to database
    try {
      await supabase.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
    } catch (err) {
      // Ignore duplicate errors
    }
    
    setSubmitted(true);
    localStorage.setItem(STORAGE_KEY, "true");
    toast({ title: "Kiitos tilauksesta! 🎉", description: "Alennuskoodisi on tulossa sähköpostiisi." });
    setTimeout(() => setOpen(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] sm:max-w-sm p-0 overflow-hidden gap-0 [&>button]:hidden rounded-xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl text-foreground">Saat 10% alennuksen! 🎁</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Tilaa uutiskirje ja saat alennuskoodin ensimmäiseen tilaukseesi.
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center space-y-2">
              <Mail className="h-10 w-10 text-primary mx-auto" />
              <p className="font-bold text-foreground">Kiitos! 🎉</p>
              <p className="text-sm text-muted-foreground">
                Alennuskoodisi on matkalla sähköpostiisi.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="anna@sahkoposti.fi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-muted border-border"
                autoFocus={window.innerWidth >= 768}
              />
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold h-11 shadow-glow-lime"
              >
                Tilaa ja saat 10% alennuksen 🚀
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors py-2"
              >
                Ei kiitos, en halua alennusta
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

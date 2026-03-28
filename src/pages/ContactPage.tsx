import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, Clock } from "lucide-react";

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Ota yhteyttä – Huumorikauppa",
  "url": "https://huumorikauppa.fi/yhteystiedot",
  "mainEntity": {
    "@type": "Organization",
    "name": "Huumorikauppa",
    "email": "info@huumorikauppa.fi",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Helsinki",
      "addressCountry": "FI"
    }
  }
};

const ContactPage = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Viesti lähetetty! 📧", description: "Vastaamme 1–2 arkipäivässä." });
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title="Ota yhteyttä – Asiakaspalvelu | Huumorikauppa.fi"
        description="Ota yhteyttä Huumorikaupan asiakaspalveluun. Vastaamme 1–2 arkipäivässä. Sähköposti: info@huumorikauppa.fi. Helsinki, Suomi."
        canonical="https://huumorikauppa.fi/yhteystiedot"
        jsonLd={contactJsonLd}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Ota yhteyttä", url: "https://huumorikauppa.fi/yhteystiedot" },
        ]}
      />

      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Ota yhteyttä</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Ota yhteyttä</h1>
      <p className="text-muted-foreground mb-8">Onko kysyttävää? Olemme täällä sinua varten!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
          <Mail className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground text-sm">Sähköposti</h3>
            <a href="mailto:info@huumorikauppa.fi" className="text-sm text-primary hover:underline">info@huumorikauppa.fi</a>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground text-sm">Sijainti</h3>
            <p className="text-sm text-muted-foreground">Helsinki, Suomi 🇫🇮</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
          <Clock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground text-sm">Vastausaika</h3>
            <p className="text-sm text-muted-foreground">1–2 arkipäivää</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border border-border rounded-lg p-6 bg-card">
        <h2 className="font-display text-xl text-foreground mb-2">Lähetä viesti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nimi *</label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Matti Meikäläinen" className="bg-muted" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Sähköposti *</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="matti@esimerkki.fi" className="bg-muted" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Aihe *</label>
          <Select value={subject} onValueChange={setSubject} required>
            <SelectTrigger className="bg-muted">
              <SelectValue placeholder="Valitse aihe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tilaus">Tilaukseen liittyvä kysymys</SelectItem>
              <SelectItem value="palautus">Palautus tai vaihto</SelectItem>
              <SelectItem value="tuote">Tuotekysymys</SelectItem>
              <SelectItem value="custom">Custom-painatus</SelectItem>
              <SelectItem value="yhteistyo">Yhteistyöehdotus</SelectItem>
              <SelectItem value="muu">Muu asia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Viesti *</label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder="Kerro miten voimme auttaa..." className="bg-muted min-h-[120px]" />
        </div>
        <Button type="submit" className="bg-primary text-primary-foreground font-bold h-11 px-8 shadow-glow-lime">
          Lähetä viesti 📧
        </Button>
      </form>
    </div>
  );
};

export default ContactPage;

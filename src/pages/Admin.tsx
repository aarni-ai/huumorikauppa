import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, RefreshCw, LogOut, Package, AlertCircle, CheckCircle2, Mail, Eye, X, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface OrderRow {
  id: string;
  stripe_session_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address: any;
  items: any;
  total: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  fulfilled: boolean;
  created_at: string;
}

interface WebhookLog {
  id: string;
  event_type: string;
  event_id: string | null;
  stripe_session_id: string | null;
  success: boolean;
  error_message: string | null;
  raw_data: any;
  created_at: string;
}

interface EmailLog {
  id: string;
  order_id: string | null;
  to_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  email_type: string;
  created_at: string;
}

type StatusFilter = "all" | "paid" | "pending" | "fulfilled" | "cancelled";

const Admin = () => {
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [syncingMl, setSyncingMl] = useState(false);
  const [syncingPrintify, setSyncingPrintify] = useState(false);

  // Auth + role guard
  useEffect(() => {
    let mounted = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/admin/login", { replace: true });
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) {
        toast({ title: "Ei oikeuksia", description: "Vain admin-käyttäjät", variant: "destructive" });
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
        return;
      }
      setAuthChecking(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, webhookRes, emailRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data as OrderRow[]);
    if (webhookRes.data) setWebhookLogs(webhookRes.data as WebhookLog[]);
    if (emailRes.data) setEmailLogs(emailRes.data as EmailLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authChecking) return;
    loadData();

    // Realtime: orders changes
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadData();
        toast({ title: "Tilauslista päivitetty 🔔" });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "webhook_logs" }, (payload) => {
        setWebhookLogs((prev) => [payload.new as WebhookLog, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authChecking, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const handleResend = async (order: OrderRow, includeAdmin: boolean) => {
    setResendingId(order.id);
    try {
      const { data, error } = await supabase.functions.invoke("resend-order-confirmation", {
        body: { orderId: order.id, resendAdmin: includeAdmin },
      });
      if (error) throw error;
      if (data?.customerEmailSent) {
        toast({ title: "Vahvistus lähetetty asiakkaalle ✓" });
        loadData();
      } else {
        toast({ title: "Lähetys epäonnistui", description: data?.customerEmailError, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Virhe", description: err instanceof Error ? err.message : "Tuntematon virhe", variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const handleMarkFulfilled = async (order: OrderRow) => {
    setMarkingId(order.id);
    const { error } = await supabase
      .from("orders")
      .update({ fulfilled: !order.fulfilled, status: !order.fulfilled ? "shipped" : "paid" })
      .eq("id", order.id);
    setMarkingId(null);
    if (error) {
      toast({ title: "Virhe", description: error.message, variant: "destructive" });
    } else {
      toast({ title: order.fulfilled ? "Merkitty toimittamattomaksi" : "Merkitty toimitetuksi ✓" });
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "fulfilled") return o.fulfilled;
    if (filter === "pending") return o.status === "pending";
    if (filter === "paid") return o.status === "paid" && !o.fulfilled;
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  if (authChecking) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 max-w-7xl">
      <SEOHead title="Admin – Huumorikauppa" description="Huumorikaupan admin-paneeli" noindex />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-foreground">Admin-paneeli 🎯</h1>
          <p className="text-sm text-muted-foreground">Tilausten ja webhook-lokien hallinta</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            disabled={syncingPrintify}
            onClick={async () => {
              setSyncingPrintify(true);
              try {
                const { data, error } = await supabase.functions.invoke("sync-printify", {
                  body: { mode: "replace" },
                });
                if (error) throw error;
                toast({
                  title: "Printify-synkronointi valmis",
                  description: `Synkronoitu ${data?.products_synced ?? 0}/${data?.total_fetched ?? 0} tuotetta.`,
                });
              } catch (e: any) {
                toast({ title: "Printify-sync epäonnistui", description: e?.message ?? "Tuntematon virhe", variant: "destructive" });
              } finally {
                setSyncingPrintify(false);
              }
            }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncingPrintify ? "animate-spin" : ""}`} /> Synkronoi Printify
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            disabled={syncingMl}
            onClick={async () => {
              setSyncingMl(true);
              try {
                const { data, error } = await supabase.functions.invoke("sync-mailerlite-products");
                if (error) throw error;
                toast({
                  title: "MailerLite-synkronointi valmis",
                  description: `Synkronoitu ${data?.synced ?? 0}/${data?.total ?? 0} tuotetta${data?.failed ? `, ${data.failed} virhettä` : ""}.`,
                });
              } catch (e: any) {
                toast({ title: "Synkronointi epäonnistui", description: e?.message ?? "Tuntematon virhe", variant: "destructive" });
              } finally {
                setSyncingMl(false);
              }
            }}
          >
            <Send className={`h-4 w-4 mr-2 ${syncingMl ? "animate-pulse" : ""}`} /> Synkronoi MailerLiteen
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} className="border-border" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Päivitä
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-border">
            <LogOut className="h-4 w-4 mr-2" /> Kirjaudu ulos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Tilauksia yhteensä" value={orders.length} icon={<Package className="h-5 w-5" />} />
        <StatCard title="Maksettu" value={orders.filter((o) => o.status === "paid" && !o.fulfilled).length} icon={<CheckCircle2 className="h-5 w-5 text-primary" />} />
        <StatCard title="Toimitettu" value={orders.filter((o) => o.fulfilled).length} icon={<CheckCircle2 className="h-5 w-5 text-muted-foreground" />} />
        <StatCard title="Webhook-virheitä" value={webhookLogs.filter((l) => !l.success).length} icon={<AlertCircle className="h-5 w-5 text-destructive" />} />
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Tilaukset ({orders.length})</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook-lokit ({webhookLogs.length})</TabsTrigger>
          <TabsTrigger value="emails">Sähköposti-lokit ({emailLogs.length})</TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "paid", "pending", "fulfilled", "cancelled"] as StatusFilter[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-primary text-primary-foreground" : "border-border"}
              >
                {f === "all" ? "Kaikki" : f === "paid" ? "Maksetut" : f === "pending" ? "Odottavat" : f === "fulfilled" ? "Toimitetut" : "Peruutetut"}
              </Button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-foreground font-medium">Aika</th>
                    <th className="px-4 py-3 text-foreground font-medium">Asiakas</th>
                    <th className="px-4 py-3 text-foreground font-medium">Summa</th>
                    <th className="px-4 py-3 text-foreground font-medium">Tila</th>
                    <th className="px-4 py-3 text-foreground font-medium">Toimet</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
                  )}
                  {!loading && filteredOrders.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Ei tilauksia</td></tr>
                  )}
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleString("fi-FI")}</td>
                      <td className="px-4 py-3 text-foreground">
                        <div>{o.customer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{Number(o.total).toFixed(2)} €</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} fulfilled={o.fulfilled} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(o)} title="Näytä">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleResend(o, false)} disabled={resendingId === o.id} title="Lähetä asiakkaalle uudelleen">
                            {resendingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleMarkFulfilled(o)} disabled={markingId === o.id} title={o.fulfilled ? "Toimitettu" : "Merkitse toimitetuksi"}>
                            {markingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className={`h-4 w-4 ${o.fulfilled ? "text-primary" : ""}`} />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Webhook logs */}
        <TabsContent value="webhooks">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3">Aika</th>
                    <th className="px-4 py-3">Tapahtuma</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Tila</th>
                    <th className="px-4 py-3">Virhe / lisätieto</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookLogs.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("fi-FI")}</td>
                      <td className="px-4 py-3 text-foreground font-mono text-xs">{l.event_type}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.stripe_session_id?.slice(0, 20) || "—"}</td>
                      <td className="px-4 py-3">
                        {l.success
                          ? <Badge variant="outline" className="border-primary text-primary">OK</Badge>
                          : <Badge variant="destructive">VIRHE</Badge>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate">{l.error_message || (l.raw_data ? JSON.stringify(l.raw_data) : "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Email logs */}
        <TabsContent value="emails">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3">Aika</th>
                    <th className="px-4 py-3">Vastaanottaja</th>
                    <th className="px-4 py-3">Tyyppi</th>
                    <th className="px-4 py-3">Aihe</th>
                    <th className="px-4 py-3">Tila</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("fi-FI")}</td>
                      <td className="px-4 py-3 text-foreground">{l.to_email}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="border-border">{l.email_type}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{l.subject}</td>
                      <td className="px-4 py-3">
                        {l.status === "success"
                          ? <Badge variant="outline" className="border-primary text-primary">OK</Badge>
                          : <Badge variant="destructive">{l.status}</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-foreground">Tilauksen tiedot</h2>
              <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3 text-sm">
              <Detail label="Order ID" value={selectedOrder.id} mono />
              <Detail label="Stripe Session" value={selectedOrder.stripe_session_id || "—"} mono />
              <Detail label="Asiakas" value={`${selectedOrder.customer_name || "—"} (${selectedOrder.customer_email || "—"})`} />
              <Detail label="Toimitusosoite" value={selectedOrder.shipping_address ? `${selectedOrder.shipping_address.address || ""}, ${selectedOrder.shipping_address.zip || ""} ${selectedOrder.shipping_address.city || ""}` : "—"} />
              <Detail label="Tila" value={`${selectedOrder.status}${selectedOrder.fulfilled ? " · Toimitettu" : ""}`} />
              <Detail label="Yhteensä" value={`${Number(selectedOrder.total).toFixed(2)} €`} />
              <div>
                <div className="text-xs text-muted-foreground uppercase font-medium mb-2">Tuotteet</div>
                <div className="space-y-1 bg-muted/30 rounded p-3">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((it: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between">
                        <span className="text-foreground">{it.quantity}× {it.name}</span>
                        <span className="text-muted-foreground">{Number(it.price).toFixed(2)} €</span>
                      </div>
                      {it.customText && (
                        <p className="text-xs text-primary font-medium break-words">✍️ OMA TEKSTI: ”{it.customText}”</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button size="sm" onClick={() => handleResend(selectedOrder, false)} disabled={resendingId === selectedOrder.id} className="bg-primary text-primary-foreground">
                  {resendingId === selectedOrder.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Lähetä asiakkaalle uudelleen
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleResend(selectedOrder, true)} disabled={resendingId === selectedOrder.id} className="border-border">
                  Lähetä myös adminille
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground uppercase font-medium">{title}</span>
      {icon}
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
  </div>
);

const StatusBadge = ({ status, fulfilled }: { status: string; fulfilled: boolean }) => {
  if (fulfilled) return <Badge className="bg-primary text-primary-foreground">Toimitettu</Badge>;
  if (status === "paid") return <Badge variant="outline" className="border-primary text-primary">Maksettu</Badge>;
  if (status === "pending") return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Odottaa</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Peruutettu</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const Detail = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <div className="text-xs text-muted-foreground uppercase font-medium">{label}</div>
    <div className={`text-foreground ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</div>
  </div>
);

export default Admin;

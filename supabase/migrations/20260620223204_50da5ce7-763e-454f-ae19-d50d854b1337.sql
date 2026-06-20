
-- abandoned_carts table
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  cart_items jsonb NOT NULL,
  cart_total numeric NOT NULL,
  recovery_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'avoin',
  stripe_session_id text,
  reminder_1h_sent_at timestamptz,
  reminder_24h_sent_at timestamptz,
  reminder_72h_sent_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_carts TO service_role;

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read abandoned carts"
  ON public.abandoned_carts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_abandoned_carts_status ON public.abandoned_carts(status) WHERE status = 'avoin';
CREATE INDEX idx_abandoned_carts_email ON public.abandoned_carts(lower(email));
CREATE UNIQUE INDEX idx_abandoned_carts_token ON public.abandoned_carts(recovery_token);
CREATE INDEX idx_abandoned_carts_session ON public.abandoned_carts(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

CREATE TRIGGER trg_abandoned_carts_updated_at
  BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Discount code PALAA10 (-10%)
INSERT INTO public.discount_codes (code, discount_type, discount_value, is_active, description)
VALUES ('PALAA10', 'percent', 10, true, 'Hylätyn ostoskorin 72h-muistutus')
ON CONFLICT (code) DO NOTHING;

-- pg_cron: kutsu send-abandoned-cart-reminders joka 15 min
DO $$
BEGIN
  PERFORM cron.unschedule('send-abandoned-cart-reminders');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'send-abandoned-cart-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/send-abandoned-cart-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

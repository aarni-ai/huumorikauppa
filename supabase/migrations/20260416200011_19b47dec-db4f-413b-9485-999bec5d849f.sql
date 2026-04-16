-- Add fulfilled flag to orders if not exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfilled boolean NOT NULL DEFAULT false;

-- Ensure unique stripe_session_id to prevent duplicate orders
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_unique 
  ON public.orders(stripe_session_id) 
  WHERE stripe_session_id IS NOT NULL;

-- webhook_logs table for Stripe webhook debugging
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  event_id text,
  stripe_session_id text,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  raw_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_logs_created_at_idx ON public.webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_logs_session_id_idx ON public.webhook_logs(stripe_session_id);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
  ON public.webhook_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert webhook logs"
  ON public.webhook_logs FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- email_logs table for order confirmation email tracking
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL,
  error_message text,
  email_type text NOT NULL DEFAULT 'customer',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_logs_order_id_idx ON public.email_logs(order_id);
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON public.email_logs(created_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert email logs"
  ON public.email_logs FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- Allow admins to view all orders (already covered by existing policy via has_role)
-- Add admins delete-not-allowed but they can update fulfilled flag (already have UPDATE policy)

-- Enable realtime for orders & webhook_logs so admin dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;
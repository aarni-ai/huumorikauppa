-- Manual fulfillment status for supplier (AliExpress) order lines.
-- One row per (order, line). Status: tilaamatta | tilattu | lähetetty.

CREATE TABLE IF NOT EXISTS public.supplier_fulfillment (
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  line_key text NOT NULL,
  status text NOT NULL DEFAULT 'tilaamatta',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, line_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_fulfillment TO service_role;
ALTER TABLE public.supplier_fulfillment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage supplier fulfillment"
  ON public.supplier_fulfillment FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

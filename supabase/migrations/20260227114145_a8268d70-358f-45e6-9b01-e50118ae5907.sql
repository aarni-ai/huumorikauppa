
-- Fix overly permissive orders INSERT policy
-- Drop the old policy and create a more restrictive one
DROP POLICY "Anyone can create orders (guest checkout)" ON public.orders;

-- Allow authenticated users to create orders with their user_id, 
-- and allow anonymous/service role for guest checkout via edge functions
CREATE POLICY "Authenticated users can create their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can create guest orders"
  ON public.orders FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

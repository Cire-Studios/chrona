-- Add UPDATE policy to user_subscriptions table
-- This allows the service role (used by edge functions) and users to update their own subscriptions
-- Note: Service role bypasses RLS, but this policy ensures proper coverage for authenticated users

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
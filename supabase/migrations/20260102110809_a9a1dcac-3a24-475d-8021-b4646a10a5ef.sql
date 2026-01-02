-- Drop and recreate the UPDATE policy with both USING and WITH CHECK conditions
-- This ensures users can only update their own notification settings

DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;

CREATE POLICY "Users can update their own notification settings"
ON public.notification_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
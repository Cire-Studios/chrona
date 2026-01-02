-- Remove the email column from profiles table to prevent exposure risk
-- The email is already securely accessible via auth.users through the authenticated session

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
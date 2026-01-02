-- Create notification settings table for user-configurable reminders
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_reminder_time TIME NOT NULL DEFAULT '18:00:00',
  weekly_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  weekly_reminder_day INTEGER NOT NULL DEFAULT 0, -- 0 = Sunday
  weekly_reminder_time TIME NOT NULL DEFAULT '10:00:00',
  quarterly_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  quarterly_reminder_day INTEGER NOT NULL DEFAULT 5, -- day 5 of 7-day window
  quarterly_reminder_time TIME NOT NULL DEFAULT '10:00:00',
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notification settings"
ON public.notification_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.notification_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.notification_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table to track sent reminders (avoid duplicate sends)
CREATE TABLE public.sent_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- 'daily', 'weekly', 'quarterly'
  reminder_date DATE NOT NULL,
  role_id UUID,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reminder_type, reminder_date, role_id)
);

-- Enable RLS
ALTER TABLE public.sent_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for sent_reminders
CREATE POLICY "Users can view their own sent reminders"
ON public.sent_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sent reminders"
ON public.sent_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);
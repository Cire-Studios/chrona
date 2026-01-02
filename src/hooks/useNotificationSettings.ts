import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface NotificationSettings {
  id?: string;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  weekly_reminder_enabled: boolean;
  weekly_reminder_day: number;
  weekly_reminder_time: string;
  quarterly_reminder_enabled: boolean;
  quarterly_reminder_day: number;
  quarterly_reminder_time: string;
  email_notifications_enabled: boolean;
  timezone: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  daily_reminder_enabled: true,
  daily_reminder_time: "18:00:00",
  weekly_reminder_enabled: true,
  weekly_reminder_day: 0, // Sunday
  weekly_reminder_time: "10:00:00",
  quarterly_reminder_enabled: true,
  quarterly_reminder_day: 5,
  quarterly_reminder_time: "10:00:00",
  email_notifications_enabled: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
};

export function useNotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          daily_reminder_enabled: data.daily_reminder_enabled,
          daily_reminder_time: data.daily_reminder_time,
          weekly_reminder_enabled: data.weekly_reminder_enabled,
          weekly_reminder_day: data.weekly_reminder_day,
          weekly_reminder_time: data.weekly_reminder_time,
          quarterly_reminder_enabled: data.quarterly_reminder_enabled,
          quarterly_reminder_day: data.quarterly_reminder_day,
          quarterly_reminder_time: data.quarterly_reminder_time,
          email_notifications_enabled: data.email_notifications_enabled,
          timezone: data.timezone,
        });
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    setSaving(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };

      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from("notification_settings")
          .update({
            daily_reminder_enabled: updatedSettings.daily_reminder_enabled,
            daily_reminder_time: updatedSettings.daily_reminder_time,
            weekly_reminder_enabled: updatedSettings.weekly_reminder_enabled,
            weekly_reminder_day: updatedSettings.weekly_reminder_day,
            weekly_reminder_time: updatedSettings.weekly_reminder_time,
            quarterly_reminder_enabled: updatedSettings.quarterly_reminder_enabled,
            quarterly_reminder_day: updatedSettings.quarterly_reminder_day,
            quarterly_reminder_time: updatedSettings.quarterly_reminder_time,
            email_notifications_enabled: updatedSettings.email_notifications_enabled,
            timezone: updatedSettings.timezone,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("notification_settings")
          .insert({
            user_id: user.id,
            daily_reminder_enabled: updatedSettings.daily_reminder_enabled,
            daily_reminder_time: updatedSettings.daily_reminder_time,
            weekly_reminder_enabled: updatedSettings.weekly_reminder_enabled,
            weekly_reminder_day: updatedSettings.weekly_reminder_day,
            weekly_reminder_time: updatedSettings.weekly_reminder_time,
            quarterly_reminder_enabled: updatedSettings.quarterly_reminder_enabled,
            quarterly_reminder_day: updatedSettings.quarterly_reminder_day,
            quarterly_reminder_time: updatedSettings.quarterly_reminder_time,
            email_notifications_enabled: updatedSettings.email_notifications_enabled,
            timezone: updatedSettings.timezone,
          })
          .select()
          .single();

        if (error) throw error;
        updatedSettings.id = data.id;
      }

      setSettings(updatedSettings);
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, saveSettings };
}

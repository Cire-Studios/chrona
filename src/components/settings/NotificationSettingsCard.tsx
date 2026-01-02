import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Clock, Calendar } from "lucide-react";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const QUARTERLY_DAYS = [
  { value: 1, label: "Day 1 of 7" },
  { value: 2, label: "Day 2 of 7" },
  { value: 3, label: "Day 3 of 7" },
  { value: 4, label: "Day 4 of 7" },
  { value: 5, label: "Day 5 of 7" },
  { value: 6, label: "Day 6 of 7" },
  { value: 7, label: "Day 7 of 7 (final day)" },
];

export const NotificationSettingsCard = () => {
  const { settings, loading, saving, saveSettings } = useNotificationSettings();

  const formatTimeForInput = (time: string) => {
    // Convert "18:00:00" to "18:00"
    return time.slice(0, 5);
  };

  const formatTimeForSave = (time: string) => {
    // Convert "18:00" to "18:00:00"
    return time + ":00";
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Reminder Settings
        </CardTitle>
        <CardDescription>
          Configure when and how you receive reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email notifications toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-xs text-muted-foreground">
              Receive reminder emails when you haven't completed your entries
            </p>
          </div>
          <Switch
            checked={settings.email_notifications_enabled}
            onCheckedChange={(checked) =>
              saveSettings({ email_notifications_enabled: checked })
            }
            disabled={saving}
          />
        </div>

        <div className="border-t border-border/50 pt-6 space-y-6">
          {/* Daily reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>Daily Journal Reminder</Label>
              </div>
              <Switch
                checked={settings.daily_reminder_enabled}
                onCheckedChange={(checked) =>
                  saveSettings({ daily_reminder_enabled: checked })
                }
                disabled={saving}
              />
            </div>
            {settings.daily_reminder_enabled && (
              <div className="ml-6 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Remind at</span>
                <Input
                  type="time"
                  value={formatTimeForInput(settings.daily_reminder_time)}
                  onChange={(e) =>
                    saveSettings({ daily_reminder_time: formatTimeForSave(e.target.value) })
                  }
                  className="w-32"
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Weekly reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label>Weekly Reflection Reminder</Label>
              </div>
              <Switch
                checked={settings.weekly_reminder_enabled}
                onCheckedChange={(checked) =>
                  saveSettings({ weekly_reminder_enabled: checked })
                }
                disabled={saving}
              />
            </div>
            {settings.weekly_reminder_enabled && (
              <div className="ml-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Remind on</span>
                <Select
                  value={String(settings.weekly_reminder_day)}
                  onValueChange={(value) =>
                    saveSettings({ weekly_reminder_day: parseInt(value) })
                  }
                  disabled={saving}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">at</span>
                <Input
                  type="time"
                  value={formatTimeForInput(settings.weekly_reminder_time)}
                  onChange={(e) =>
                    saveSettings({ weekly_reminder_time: formatTimeForSave(e.target.value) })
                  }
                  className="w-32"
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Quarterly reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label>Quarterly Finalization Reminder</Label>
              </div>
              <Switch
                checked={settings.quarterly_reminder_enabled}
                onCheckedChange={(checked) =>
                  saveSettings({ quarterly_reminder_enabled: checked })
                }
                disabled={saving}
              />
            </div>
            {settings.quarterly_reminder_enabled && (
              <div className="ml-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Remind on</span>
                <Select
                  value={String(settings.quarterly_reminder_day)}
                  onValueChange={(value) =>
                    saveSettings({ quarterly_reminder_day: parseInt(value) })
                  }
                  disabled={saving}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERLY_DAYS.map((day) => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">at</span>
                <Input
                  type="time"
                  value={formatTimeForInput(settings.quarterly_reminder_time)}
                  onChange={(e) =>
                    saveSettings({ quarterly_reminder_time: formatTimeForSave(e.target.value) })
                  }
                  className="w-32"
                  disabled={saving}
                />
              </div>
            )}
            <p className="ml-6 text-xs text-muted-foreground">
              After each quarter ends, you have 7 days to finalize. This reminder is sent during that window.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

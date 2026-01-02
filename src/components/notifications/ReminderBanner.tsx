import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, PenLine, Sparkles, Layers, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, addDays, isWithinInterval } from "date-fns";

type ReminderType = "daily" | "weekly" | "quarterly" | null;

interface ReminderInfo {
  type: ReminderType;
  message: string;
  link: string;
  icon: React.ReactNode;
  urgency: "info" | "warning" | "urgent";
}

export const ReminderBanner = () => {
  const { user } = useAuth();
  const { activeRole } = useRoles();
  const [reminder, setReminder] = useState<ReminderInfo | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !activeRole) {
      setReminder(null);
      return;
    }

    checkReminders();
  }, [user, activeRole]);

  const checkReminders = async () => {
    if (!user || !activeRole) return;

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    // Check for missing daily entry
    const { data: todayEntry } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("role_id", activeRole.id)
      .eq("entry_date", todayStr)
      .maybeSingle();

    if (!todayEntry) {
      setReminder({
        type: "daily",
        message: "Don't forget to log today's accomplishments!",
        link: "/journal",
        icon: <PenLine size={16} />,
        urgency: "info",
      });
      return;
    }

    // Check for weekly reflection (on Sunday or if entries exist but no reflection)
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const dayOfWeek = today.getDay();

    if (dayOfWeek === 0) {
      // Sunday - check if weekly reflection is done
      const { data: weeklyReflection } = await supabase
        .from("weekly_reflections")
        .select("id")
        .eq("role_id", activeRole.id)
        .eq("week_start_date", format(weekStart, "yyyy-MM-dd"))
        .maybeSingle();

      const { data: weekEntries } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("role_id", activeRole.id)
        .gte("entry_date", format(weekStart, "yyyy-MM-dd"))
        .lte("entry_date", format(weekEnd, "yyyy-MM-dd"));

      if (!weeklyReflection && weekEntries && weekEntries.length > 0) {
        setReminder({
          type: "weekly",
          message: "Complete your weekly reflection before the week ends!",
          link: "/weekly",
          icon: <Sparkles size={16} />,
          urgency: "warning",
        });
        return;
      }
    }

    // Check for quarterly finalization (7-day window after quarter ends)
    const currentQuarterStart = startOfQuarter(today);
    const currentQuarterEnd = endOfQuarter(today);
    const prevQuarterStart = startOfQuarter(new Date(today.getFullYear(), today.getMonth() - 3, 1));
    const prevQuarterEnd = endOfQuarter(prevQuarterStart);
    
    const windowStart = addDays(prevQuarterEnd, 1);
    const windowEnd = addDays(prevQuarterEnd, 7);
    
    const inFinalizationWindow = isWithinInterval(today, { start: windowStart, end: windowEnd });

    if (inFinalizationWindow) {
      const { data: quarterlyRecord } = await supabase
        .from("quarterly_records")
        .select("id, status")
        .eq("role_id", activeRole.id)
        .eq("quarter_start_date", format(prevQuarterStart, "yyyy-MM-dd"))
        .maybeSingle();

      if (!quarterlyRecord || quarterlyRecord.status !== "finalized") {
        const daysRemaining = Math.ceil((windowEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setReminder({
          type: "quarterly",
          message: `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left to finalize your quarterly distillation!`,
          link: "/quarterly",
          icon: <Layers size={16} />,
          urgency: daysRemaining <= 2 ? "urgent" : "warning",
        });
        return;
      }
    }

    setReminder(null);
  };

  if (!reminder || dismissed === reminder.type) return null;

  const urgencyColors = {
    info: "border-primary/30 bg-primary/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    urgent: "border-destructive/30 bg-destructive/5",
  };

  const urgencyTextColors = {
    info: "text-primary",
    warning: "text-yellow-600 dark:text-yellow-400",
    urgent: "text-destructive",
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pt-4">
      <Alert className={`${urgencyColors[reminder.urgency]} border`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={urgencyTextColors[reminder.urgency]}>
              {reminder.icon}
            </div>
            <AlertDescription className="text-sm">
              {reminder.message}
            </AlertDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link to={reminder.link}>
              <Button variant="ghost" size="sm">
                Go now
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setDismissed(reminder.type)}
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

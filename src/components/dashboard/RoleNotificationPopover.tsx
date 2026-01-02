import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, PenLine, Sparkles, Layers, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, addDays, isWithinInterval } from "date-fns";

interface Notification {
  type: "daily" | "weekly" | "quarterly";
  message: string;
  link: string;
  icon: React.ReactNode;
  urgency: "info" | "warning" | "urgent";
}

interface RoleNotificationPopoverProps {
  roleId: string;
  userId: string;
}

export const RoleNotificationPopover = ({ roleId, userId }: RoleNotificationPopoverProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    checkNotifications();
  }, [roleId, userId]);

  const checkNotifications = async () => {
    const newNotifications: Notification[] = [];
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    // Check for missing daily entry - skip this for the popover since it's shown in CTA
    // Only show weekly and quarterly deadlines

    // Check for weekly reflection (on Sunday or if entries exist but no reflection)
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const dayOfWeek = today.getDay();

    if (dayOfWeek === 0) {
      const { data: weeklyReflection } = await supabase
        .from("weekly_reflections")
        .select("id")
        .eq("role_id", roleId)
        .eq("week_start_date", format(weekStart, "yyyy-MM-dd"))
        .maybeSingle();

      const { data: weekEntries } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("role_id", roleId)
        .gte("entry_date", format(weekStart, "yyyy-MM-dd"))
        .lte("entry_date", format(weekEnd, "yyyy-MM-dd"));

      if (!weeklyReflection && weekEntries && weekEntries.length > 0) {
        newNotifications.push({
          type: "weekly",
          message: "Complete your weekly reflection before the week ends",
          link: "/weekly",
          icon: <Sparkles size={14} />,
          urgency: "warning",
        });
      }
    }

    // Check for quarterly finalization (7-day window after quarter ends)
    const prevQuarterStart = startOfQuarter(new Date(today.getFullYear(), today.getMonth() - 3, 1));
    const prevQuarterEnd = endOfQuarter(prevQuarterStart);
    
    const windowStart = addDays(prevQuarterEnd, 1);
    const windowEnd = addDays(prevQuarterEnd, 7);
    
    const inFinalizationWindow = isWithinInterval(today, { start: windowStart, end: windowEnd });

    if (inFinalizationWindow) {
      const { data: quarterlyRecord } = await supabase
        .from("quarterly_records")
        .select("id, status")
        .eq("role_id", roleId)
        .eq("quarter_start_date", format(prevQuarterStart, "yyyy-MM-dd"))
        .maybeSingle();

      if (!quarterlyRecord || quarterlyRecord.status !== "finalized") {
        const daysRemaining = Math.ceil((windowEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        newNotifications.push({
          type: "quarterly",
          message: `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left to finalize quarterly`,
          link: "/quarterly",
          icon: <Layers size={14} />,
          urgency: daysRemaining <= 2 ? "urgent" : "warning",
        });
      }
    }

    setNotifications(newNotifications);
  };

  if (notifications.length === 0) return null;

  const urgencyColors = {
    info: "text-primary",
    warning: "text-yellow-500",
    urgent: "text-destructive",
  };

  const highestUrgency = notifications.some(n => n.urgency === "urgent") 
    ? "urgent" 
    : notifications.some(n => n.urgency === "warning") 
      ? "warning" 
      : "info";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors hover:bg-secondary/50 ${urgencyColors[highestUrgency]}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Bell size={16} className="animate-pulse" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border/50">
          <h4 className="font-medium text-sm">Upcoming Deadlines</h4>
        </div>
        <div className="p-2 space-y-1">
          {notifications.map((notification, index) => (
            <Link
              key={index}
              to={notification.link}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className={`mt-0.5 ${urgencyColors[notification.urgency]}`}>
                {notification.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{notification.message}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="p-2 border-t border-border/50">
          {notifications.map((notification, index) => (
            <Link key={index} to={notification.link} onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                {notification.icon}
                Go to {notification.type === "weekly" ? "Weekly Reflection" : "Quarterly Distillation"}
              </Button>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

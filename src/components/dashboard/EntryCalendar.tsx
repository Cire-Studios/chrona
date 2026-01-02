import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";

interface EntryData {
  id: string;
  entry_date: string;
  role_id: string;
  accomplishments: string | null;
  decisions: string | null;
  challenges: string | null;
  learnings: string | null;
}

interface DayEntries {
  [dateKey: string]: {
    entries: EntryData[];
    roleColors: string[];
  };
}

interface EntryCalendarProps {
  roleIds?: string[];
}

export const EntryCalendar = ({ roleIds }: EntryCalendarProps) => {
  const { user } = useAuth();
  const { roles, setActiveRole } = useRoles();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [monthEntries, setMonthEntries] = useState<DayEntries>({});
  const [loading, setLoading] = useState(true);

  const roleColorMap = useMemo(() => {
    return new Map(roles.map((r) => [r.id, { color: r.color, title: r.title }]));
  }, [roles]);

  // Fetch entries for the visible month
  useEffect(() => {
    const fetchMonthEntries = async () => {
      if (!user) return;

      setLoading(true);

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      try {
        let query = supabase
          .from("journal_entries")
          .select("id, entry_date, role_id, accomplishments, decisions, challenges, learnings")
          .gte("entry_date", format(monthStart, "yyyy-MM-dd"))
          .lte("entry_date", format(monthEnd, "yyyy-MM-dd"));

        // Filter by role IDs if provided
        if (roleIds && roleIds.length > 0) {
          query = query.in("role_id", roleIds);
        }

        const { data, error } = await query.order("entry_date", { ascending: true });

        if (error) throw error;

        // Group entries by date
        const grouped: DayEntries = {};
        data?.forEach((entry) => {
          const dateKey = entry.entry_date;
          if (!grouped[dateKey]) {
            grouped[dateKey] = { entries: [], roleColors: [] };
          }
          grouped[dateKey].entries.push(entry);
          const roleInfo = roleColorMap.get(entry.role_id);
          if (roleInfo && !grouped[dateKey].roleColors.includes(roleInfo.color)) {
            grouped[dateKey].roleColors.push(roleInfo.color);
          }
        });

        setMonthEntries(grouped);
      } catch (error) {
        console.error("Error fetching entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthEntries();
  }, [user, currentMonth, roleColorMap, roleIds]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedDayEntries = selectedDateKey ? monthEntries[selectedDateKey]?.entries || [] : [];

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Entry Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs h-7 px-2"
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousMonth}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Calendar Grid */}
        <div className="mb-4">
          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayData = monthEntries[dateKey];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasEntries = dayData && dayData.entries.length > 0;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative aspect-square p-1 rounded-lg text-sm transition-all",
                    "hover:bg-secondary/50",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isToday(day) && !isSelected && "bg-primary/10 text-primary font-medium",
                    isSelected && "bg-primary text-primary-foreground font-medium"
                  )}
                >
                  <span className="block">{format(day, "d")}</span>
                  {/* Entry indicator dots */}
                  {hasEntries && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayData.roleColors.slice(0, 3).map((color, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isSelected && "opacity-80"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      {dayData.roleColors.length > 3 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day entries */}
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a day"}
          </h3>

          {loading ? (
            <div className="text-center py-6 text-muted-foreground text-sm animate-pulse">
              Loading entries...
            </div>
          ) : selectedDayEntries.length === 0 ? (
            <div className="text-center py-6">
              <FileText size={24} className="mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No entries for this day</p>
              {selectedDate && isSameDay(selectedDate, new Date()) && (
                <Link to="/journal">
                  <Button variant="link" size="sm" className="mt-1">
                    Create an entry →
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {selectedDayEntries.map((entry) => {
                const roleInfo = roleColorMap.get(entry.role_id);
                const preview =
                  entry.accomplishments ||
                  entry.decisions ||
                  entry.challenges ||
                  entry.learnings ||
                  "No content";

                return (
                  <Link
                    key={entry.id}
                    to="/journal"
                    onClick={() => {
                      const role = roles.find((r) => r.id === entry.role_id);
                      if (role) setActiveRole(role);
                    }}
                    className="block p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: roleInfo?.color || "#888" }}
                      />
                      <span className="text-sm font-medium truncate">
                        {roleInfo?.title || "Unknown Role"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {preview.substring(0, 100)}
                      {preview.length > 100 ? "..." : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

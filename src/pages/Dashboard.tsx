import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { RoleStatsCard } from "@/components/dashboard/RoleStatsCard";
import { SignalTrendsChart } from "@/components/dashboard/SignalTrendsChart";
import { EntryCalendar } from "@/components/dashboard/EntryCalendar";
import { PatternBreakdown } from "@/components/dashboard/PatternBreakdown";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles, Role } from "@/contexts/RolesContext";
import { supabase } from "@/integrations/supabase/client";
import { PenLine, LayoutDashboard } from "lucide-react";
import { format, startOfWeek, subWeeks } from "date-fns";

interface RoleStats {
  role: Role;
  entryCount: number;
  signalCount: number;
  patternCount: number;
  lastEntryDate: string | null;
}

interface SignalTrend {
  week: string;
  delivery: number;
  ownership: number;
  influence: number;
  learning: number;
}

interface PatternData {
  category: string;
  count: number;
  label: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, setActiveRole } = useRoles();
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [signalTrends, setSignalTrends] = useState<SignalTrend[]>([]);
  const [patternData, setPatternData] = useState<PatternData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || roles.length === 0) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch role stats
        const roleStatsPromises = roles.map(async (role) => {
          const [entriesResult, signalsResult, patternsResult, lastEntryResult] = await Promise.all([
            supabase
              .from("journal_entries")
              .select("id", { count: "exact", head: true })
              .eq("role_id", role.id),
            supabase
              .from("entry_signals")
              .select("id, journal_entries!inner(role_id)", { count: "exact", head: true })
              .eq("journal_entries.role_id", role.id),
            supabase
              .from("quarterly_patterns")
              .select("id, quarterly_records!inner(role_id)", { count: "exact", head: true })
              .eq("quarterly_records.role_id", role.id)
              .eq("is_confirmed", true),
            supabase
              .from("journal_entries")
              .select("entry_date")
              .eq("role_id", role.id)
              .order("entry_date", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          return {
            role,
            entryCount: entriesResult.count || 0,
            signalCount: signalsResult.count || 0,
            patternCount: patternsResult.count || 0,
            lastEntryDate: lastEntryResult.data?.entry_date || null,
          };
        });

        const stats = await Promise.all(roleStatsPromises);
        setRoleStats(stats);

        // Fetch signal trends for last 8 weeks
        const weeks: SignalTrend[] = [];
        for (let i = 7; i >= 0; i--) {
          const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
          const weekLabel = format(weekStart, "MMM d");

          const { data: signals } = await supabase
            .from("entry_signals")
            .select("signal_flag, created_at")
            .gte("created_at", weekStart.toISOString())
            .lt("created_at", new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());

          const counts = {
            delivery: 0,
            ownership: 0,
            influence: 0,
            learning: 0,
          };

          signals?.forEach((signal) => {
            if (signal.signal_flag in counts) {
              counts[signal.signal_flag as keyof typeof counts]++;
            }
          });

          weeks.push({ week: weekLabel, ...counts });
        }
        setSignalTrends(weeks);

        // Fetch pattern breakdown
        const { data: patterns } = await supabase
          .from("quarterly_patterns")
          .select("category")
          .eq("is_confirmed", true);

        const categoryLabels: Record<string, string> = {
          growth: "Growth",
          scope_change: "Scope Change",
          sustained_impact: "Sustained Impact",
          skill_development: "Skill Development",
          leadership: "Leadership",
          collaboration: "Collaboration",
        };

        const categoryCounts = patterns?.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const patternBreakdown: PatternData[] = Object.entries(categoryLabels).map(
          ([category, label]) => ({
            category,
            label,
            count: categoryCounts[category] || 0,
          })
        );

        setPatternData(patternBreakdown);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, roles]);

  const handleRoleClick = (role: Role) => {
    setActiveRole(role);
  };

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const isLoading = authLoading || rolesLoading || loading;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div
          className="mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
            Career Overview
          </h1>
          <p className="text-muted-foreground">
            Track your progress across all roles with signals, patterns, and insights.
          </p>
        </div>

      {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border/50">
            <LayoutDashboard size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">No Roles Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first role to start tracking your career journey.
            </p>
            <Link to="/journal">
              <Button variant="hero" className="gap-2">
                <PenLine size={18} />
                Start Journaling
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Role Stats Grid */}
            <section
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
            >
              <h2 className="text-lg font-semibold mb-4">Your Roles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleStats.map((stats) => (
                  <Link 
                    key={stats.role.id} 
                    to="/journal"
                    onClick={() => handleRoleClick(stats.role)}
                  >
                    <RoleStatsCard stats={stats} userId={user?.id} />
                  </Link>
                ))}
              </div>
            </section>

            {/* Charts Row */}
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-0 animate-fade-up"
              style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
            >
              <SignalTrendsChart data={signalTrends} />
              <PatternBreakdown data={patternData} />
            </div>

            {/* Entry Calendar */}
            <section
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
            >
              <EntryCalendar />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

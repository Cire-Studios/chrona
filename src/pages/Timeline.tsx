import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, 
  TrendingUp, 
  Award, 
  Calendar,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { format, parseISO, differenceInMonths } from "date-fns";

interface TimelinePattern {
  id: string;
  title: string;
  category: string;
  created_at: string;
  role_id: string;
}

interface TimelineMilestone {
  id: string;
  type: "role_start" | "role_end" | "pattern" | "first_entry";
  date: string;
  title: string;
  description?: string;
  roleId?: string;
  roleColor?: string;
  category?: string;
}

const categoryColors: Record<string, string> = {
  growth: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  scope_change: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  sustained_impact: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  skill_development: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  leadership: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  collaboration: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const formatCategory = (category: string) => {
  return category.split("_").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
};

export default function Timeline() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useRoles();
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && roles.length > 0) {
      fetchTimelineData();
    } else if (!rolesLoading) {
      setLoading(false);
    }
  }, [user, roles, rolesLoading]);

  const fetchTimelineData = async () => {
    if (!user) return;

    try {
      // Fetch confirmed patterns with their record's role_id
      const { data: patterns } = await supabase
        .from("quarterly_patterns")
        .select(`
          id,
          title,
          category,
          created_at,
          record_id,
          quarterly_records!inner(role_id)
        `)
        .eq("user_id", user.id)
        .eq("is_confirmed", true);

      // Fetch first entry date per role
      const { data: entries } = await supabase
        .from("journal_entries")
        .select("role_id, entry_date")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: true });

      const firstEntryByRole: Record<string, string> = {};
      entries?.forEach(entry => {
        if (!firstEntryByRole[entry.role_id]) {
          firstEntryByRole[entry.role_id] = entry.entry_date;
        }
      });

      // Build milestones array
      const allMilestones: TimelineMilestone[] = [];

      // Add role milestones
      roles.forEach(role => {
        if (role.start_date) {
          allMilestones.push({
            id: `role-start-${role.id}`,
            type: "role_start",
            date: role.start_date,
            title: `Started as ${role.title}`,
            description: role.company || undefined,
            roleId: role.id,
            roleColor: role.color,
          });
        }

        if (role.end_date) {
          const startDate = role.start_date ? parseISO(role.start_date) : null;
          const endDate = parseISO(role.end_date);
          const duration = startDate 
            ? differenceInMonths(endDate, startDate) 
            : null;

          allMilestones.push({
            id: `role-end-${role.id}`,
            type: "role_end",
            date: role.end_date,
            title: `Completed ${role.title}`,
            description: duration 
              ? `${duration} month${duration !== 1 ? 's' : ''} in role` 
              : undefined,
            roleId: role.id,
            roleColor: role.color,
          });
        }

        // Add first journal entry milestone
        if (firstEntryByRole[role.id]) {
          allMilestones.push({
            id: `first-entry-${role.id}`,
            type: "first_entry",
            date: firstEntryByRole[role.id],
            title: `First journal entry`,
            description: role.title,
            roleId: role.id,
            roleColor: role.color,
          });
        }
      });

      // Add pattern milestones
      patterns?.forEach(pattern => {
        const roleId = (pattern.quarterly_records as any)?.role_id;
        const role = roles.find(r => r.id === roleId);
        
        allMilestones.push({
          id: `pattern-${pattern.id}`,
          type: "pattern",
          date: pattern.created_at,
          title: pattern.title,
          category: pattern.category,
          roleId: roleId,
          roleColor: role?.color,
        });
      });

      // Sort by date descending (most recent first)
      allMilestones.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMilestones(allMilestones);
    } catch (error) {
      console.error("Error fetching timeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIcon = (type: TimelineMilestone["type"]) => {
    switch (type) {
      case "role_start":
        return <Briefcase className="h-4 w-4" />;
      case "role_end":
        return <Award className="h-4 w-4" />;
      case "pattern":
        return <Sparkles className="h-4 w-4" />;
      case "first_entry":
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Career Timeline
          </h1>
          <p className="text-muted-foreground">
            Your professional journey visualized with key milestones and patterns
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {roles.length}
              </div>
              <div className="text-sm text-muted-foreground">Roles</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {milestones.filter(m => m.type === "pattern").length}
              </div>
              <div className="text-sm text-muted-foreground">Patterns</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {roles.filter(r => r.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {milestones.filter(m => m.type === "first_entry").length}
              </div>
              <div className="text-sm text-muted-foreground">Journals</div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding roles and journal entries to build your career timeline.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50" />

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div 
                    className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-background"
                    style={{ 
                      borderColor: milestone.roleColor || 'hsl(var(--primary))',
                      color: milestone.roleColor || 'hsl(var(--primary))'
                    }}
                  >
                    {getMilestoneIcon(milestone.type)}
                  </div>

                  {/* Content */}
                  <Card className="flex-1 bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-foreground">
                              {milestone.title}
                            </h3>
                            {milestone.category && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${categoryColors[milestone.category] || ''}`}
                              >
                                {formatCategory(milestone.category)}
                              </Badge>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-medium text-muted-foreground">
                            {format(parseISO(milestone.date), "MMM yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground/60">
                            {format(parseISO(milestone.date), "d")}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

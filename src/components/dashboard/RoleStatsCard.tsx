import { Link, useNavigate } from "react-router-dom";
import { Role } from "@/contexts/RolesContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Flag, TrendingUp, Calendar, PenLine } from "lucide-react";
import { RoleNotificationPopover } from "./RoleNotificationPopover";
import { format } from "date-fns";

interface RoleStats {
  role: Role;
  entryCount: number;
  signalCount: number;
  patternCount: number;
  lastEntryDate: string | null;
}

interface RoleStatsCardProps {
  stats: RoleStats;
  userId?: string;
  onClick?: () => void;
}

export const RoleStatsCard = ({ stats, userId, onClick }: RoleStatsCardProps) => {
  const navigate = useNavigate();
  const { role, entryCount, signalCount, patternCount, lastEntryDate } = stats;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No entries";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const hasEntryToday = lastEntryDate === todayStr;

  const handleCardClick = () => {
    onClick?.();
    navigate("/journal");
  };

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 bg-card/50 backdrop-blur-sm relative"
      onClick={handleCardClick}
    >
      {/* Notification Icon - Centered on top-right corner */}
      {userId && (
        <div className="absolute -top-3 -right-3 z-10">
          <RoleNotificationPopover roleId={role.id} userId={userId} />
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full ring-4 ring-opacity-20"
              style={{ 
                backgroundColor: role.color,
                boxShadow: `0 0 0 4px ${role.color}33`
              }}
            />
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {role.title}
              </h3>
              {role.company && (
                <p className="text-sm text-muted-foreground">{role.company}</p>
              )}
            </div>
          </div>
          {role.is_active && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
              Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Entries:</span>
            <span className="font-medium text-foreground">{entryCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Flag size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Signals:</span>
            <span className="font-medium text-foreground">{signalCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Patterns:</span>
            <span className="font-medium text-foreground">{patternCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Last:</span>
            <span className="font-medium text-foreground">{formatDate(lastEntryDate)}</span>
          </div>
        </div>
      </CardContent>

      {/* CTA Overlay for missing today's entry */}
      {role.is_active && !hasEntryToday && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-primary/70 px-4 py-3">
          <div 
            className="flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium text-primary-foreground">
              No entry logged today
            </span>
            <Link to="/journal">
              <Button 
                size="sm" 
                variant="secondary"
                className="gap-1.5 h-7 text-xs"
              >
                <PenLine size={12} />
                Log Entry
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
};

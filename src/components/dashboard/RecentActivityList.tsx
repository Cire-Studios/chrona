import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Flag, CheckCircle, Layers } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "entry" | "signal" | "pattern" | "quarter";
  title: string;
  description: string;
  roleColor: string;
  roleName: string;
  createdAt: string;
}

interface RecentActivityListProps {
  activities: ActivityItem[];
}

const activityIcons = {
  entry: FileText,
  signal: Flag,
  pattern: Layers,
  quarter: CheckCircle,
};

const activityColors = {
  entry: "text-blue-500 bg-blue-500/10",
  signal: "text-amber-500 bg-amber-500/10",
  pattern: "text-purple-500 bg-purple-500/10",
  quarter: "text-emerald-500 bg-emerald-500/10",
};

export const RecentActivityList = ({ activities }: RecentActivityListProps) => {
  if (activities.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText size={32} className="mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Start journaling to see your activity here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activity.roleColor }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {activity.roleName}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

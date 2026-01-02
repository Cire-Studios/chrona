import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Briefcase, Calendar, Award } from "lucide-react";

interface Role {
  id: string;
  title: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

interface Pattern {
  id: string;
  title: string;
  role_id: string;
}

interface ResumeRoleSelectorProps {
  roles: Role[];
  patterns: Pattern[];
  selectedRoleIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const ResumeRoleSelector = ({
  roles,
  patterns,
  selectedRoleIds,
  onSelectionChange,
}: ResumeRoleSelectorProps) => {
  const getPatternCountForRole = (roleId: string) => {
    return patterns.filter((p) => p.role_id === roleId).length;
  };

  const handleToggle = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      onSelectionChange(selectedRoleIds.filter((id) => id !== roleId));
    } else {
      onSelectionChange([...selectedRoleIds, roleId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRoleIds.length === roles.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(roles.map((r) => r.id));
    }
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return "Dates not specified";
    const start = format(new Date(startDate), "MMM yyyy");
    const end = endDate ? format(new Date(endDate), "MMM yyyy") : "Present";
    return `${start} - ${end}`;
  };

  if (roles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No roles found. Create a role first to build your resume.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Select the roles you want to include in your resume. Roles with verified patterns will generate better content.
        </p>
        <button
          onClick={handleSelectAll}
          className="text-sm text-primary hover:underline"
        >
          {selectedRoleIds.length === roles.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      <div className="space-y-3">
        {roles.map((role) => {
          const patternCount = getPatternCountForRole(role.id);
          const isSelected = selectedRoleIds.includes(role.id);

          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
              onClick={() => handleToggle(role.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(role.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-foreground">{role.title}</h4>
                      {role.company && (
                        <span className="text-muted-foreground">at {role.company}</span>
                      )}
                      {!role.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateRange(role.start_date, role.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        {patternCount} verified pattern{patternCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedRoleIds.length > 0 && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          {selectedRoleIds.length} role{selectedRoleIds.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
};

import { Role } from "@/contexts/RolesContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, ChevronDown } from "lucide-react";

interface DashboardRoleFilterProps {
  roles: Role[];
  selectedRoleIds: string[];
  onSelectionChange: (roleIds: string[]) => void;
}

export const DashboardRoleFilter = ({
  roles,
  selectedRoleIds,
  onSelectionChange,
}: DashboardRoleFilterProps) => {
  const { tier } = useSubscription();

  // Hide filter for starter tier users (they only have 1 role max)
  if (tier === "starter" || roles.length <= 1) {
    return null;
  }

  const allSelected = selectedRoleIds.length === roles.length;
  const noneSelected = selectedRoleIds.length === 0;

  const handleToggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      // Don't allow deselecting the last role
      if (selectedRoleIds.length > 1) {
        onSelectionChange(selectedRoleIds.filter((id) => id !== roleId));
      }
    } else {
      onSelectionChange([...selectedRoleIds, roleId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(roles.map((r) => r.id));
  };

  const getButtonLabel = () => {
    if (allSelected || noneSelected) return "All Roles";
    if (selectedRoleIds.length === 1) {
      const role = roles.find((r) => r.id === selectedRoleIds[0]);
      return role?.title || "1 Role";
    }
    return `${selectedRoleIds.length} Roles`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter size={14} />
          {getButtonLabel()}
          <ChevronDown size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-popover border border-border shadow-lg z-50" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filter by Role</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
          </div>
          <div className="space-y-2">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-md -mx-1"
              >
                <Checkbox
                  checked={selectedRoleIds.includes(role.id)}
                  onCheckedChange={() => handleToggleRole(role.id)}
                />
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: role.color || "hsl(var(--primary))" }}
                />
                <span className="text-sm truncate">{role.title}</span>
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
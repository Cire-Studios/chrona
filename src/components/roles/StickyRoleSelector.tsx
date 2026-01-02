import { useRoles } from "@/contexts/RolesContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase } from "lucide-react";

export const StickyRoleSelector = () => {
  const { roles, activeRole, setActiveRole, loading } = useRoles();

  const activeRoles = roles.filter((r) => r.is_active);

  if (loading) {
    return (
      <div className="sticky top-20 z-40 flex justify-center py-3">
        <div className="h-10 w-48 animate-pulse rounded-full bg-secondary/50" />
      </div>
    );
  }

  if (activeRoles.length === 0) {
    return null;
  }

  const handleRoleChange = (roleId: string) => {
    const role = activeRoles.find((r) => r.id === roleId);
    if (role) {
      setActiveRole(role);
    }
  };

  return (
    <div className="sticky top-20 z-40 flex justify-center py-3 pointer-events-none">
      <div className="pointer-events-auto">
        <Select value={activeRole?.id || ""} onValueChange={handleRoleChange}>
          <SelectTrigger className="h-10 gap-2 rounded-full border-border/50 bg-background/95 backdrop-blur-sm px-4 shadow-sm hover:bg-secondary/50 transition-colors min-w-[200px]">
            {activeRole ? (
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activeRole.color || "hsl(var(--primary))" }}
                />
                <span className="truncate font-medium">{activeRole.title}</span>
              </div>
            ) : (
              <SelectValue placeholder="Select role" />
            )}
          </SelectTrigger>
          <SelectContent align="center" className="min-w-[200px]">
            {activeRoles.map((role) => (
              <SelectItem key={role.id} value={role.id} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: role.color || "hsl(var(--primary))" }}
                  />
                  <span className="truncate">{role.title}</span>
                  {role.company && (
                    <span className="text-xs text-muted-foreground">@ {role.company}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

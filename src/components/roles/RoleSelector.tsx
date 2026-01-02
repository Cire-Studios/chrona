import { useState } from "react";
import { useRoles, Role } from "@/contexts/RolesContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, ChevronDown, Briefcase, Check } from "lucide-react";
import { CreateRoleDialog } from "./CreateRoleDialog";

export const RoleSelector = () => {
  const { roles, activeRole, setActiveRole, loading } = useRoles();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (loading) {
    return (
      <div className="h-10 w-48 bg-secondary/30 rounded-lg animate-pulse" />
    );
  }

  if (roles.length === 0) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <Plus size={16} />
          Create Your First Role
        </Button>
        <CreateRoleDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl",
            "bg-secondary/30 border border-border/50",
            "hover:bg-secondary/50 hover:border-primary/30",
            "transition-all duration-300",
            "min-w-[200px]"
          )}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: activeRole?.color || "#f59e0b" }}
          />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium truncate">
              {activeRole?.title || "Select Role"}
            </p>
            {activeRole?.company && (
              <p className="text-xs text-muted-foreground truncate">
                {activeRole.company}
              </p>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn(
              "text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 z-50 p-2 rounded-xl bg-card border border-border shadow-lg">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setActiveRole(role);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "hover:bg-secondary/50 transition-colors",
                    activeRole?.id === role.id && "bg-secondary/30"
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{role.title}</p>
                    {role.company && (
                      <p className="text-xs text-muted-foreground">
                        {role.company}
                      </p>
                    )}
                  </div>
                  {activeRole?.id === role.id && (
                    <Check size={16} className="text-primary" />
                  )}
                </button>
              ))}

              <div className="border-t border-border mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateDialog(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Plus size={16} />
                  <span className="text-sm">Add New Role</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CreateRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
};

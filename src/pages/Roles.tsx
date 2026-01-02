import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles, Role } from "@/contexts/RolesContext";
import { CreateRoleDialog } from "@/components/roles/CreateRoleDialog";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ROLE_COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#06b6d4", // cyan
  "#84cc16", // lime
];

interface EditingRole {
  id: string;
  title: string;
  company: string;
  description: string;
  color: string;
  start_date: string;
  end_date: string;
}

const Roles = () => {
  const { user, loading: authLoading } = useAuth();
  const { roles, activeRole, setActiveRole, updateRole, deleteRole, loading: rolesLoading } = useRoles();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<EditingRole | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const activeRoles = roles.filter((r) => r.is_active);
  const archivedRoles = roles.filter((r) => !r.is_active);

  const startEditing = (role: Role) => {
    setEditingRole({
      id: role.id,
      title: role.title,
      company: role.company || "",
      description: role.description || "",
      color: role.color,
      start_date: role.start_date || "",
      end_date: role.end_date || "",
    });
  };

  const cancelEditing = () => {
    setEditingRole(null);
  };

  const saveEditing = async () => {
    if (!editingRole) return;

    await updateRole(editingRole.id, {
      title: editingRole.title,
      company: editingRole.company || null,
      description: editingRole.description || null,
      color: editingRole.color,
      start_date: editingRole.start_date || null,
      end_date: editingRole.end_date || null,
    });

    setEditingRole(null);
  };

  const handleArchive = async (role: Role) => {
    await updateRole(role.id, { is_active: false });
  };

  const handleRestore = async (role: Role) => {
    await updateRole(role.id, { is_active: true });
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteRole(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const roleToDelete = roles.find((r) => r.id === deleteConfirmId);

  const RoleCard = ({ role, isArchived = false }: { role: Role; isArchived?: boolean }) => {
    const isEditing = editingRole?.id === role.id;
    const isActive = activeRole?.id === role.id;

    if (isEditing && editingRole) {
      return (
        <Card className="p-5 border-primary/50">
          <div className="space-y-4">
            {/* Color picker */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
              <div className="flex gap-2">
                {ROLE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditingRole({ ...editingRole, color })}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      editingRole.color === color
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-xs text-muted-foreground">
                Role Title *
              </Label>
              <Input
                id="title"
                value={editingRole.title}
                onChange={(e) => setEditingRole({ ...editingRole, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="mt-1"
              />
            </div>

            {/* Company */}
            <div>
              <Label htmlFor="company" className="text-xs text-muted-foreground">
                Company
              </Label>
              <Input
                id="company"
                value={editingRole.company}
                onChange={(e) => setEditingRole({ ...editingRole, company: e.target.value })}
                placeholder="e.g. Acme Corp"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-xs text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                value={editingRole.description}
                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                placeholder="Brief description of the role..."
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-xs text-muted-foreground">
                  Start Date
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={editingRole.start_date}
                  onChange={(e) => setEditingRole({ ...editingRole, start_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-xs text-muted-foreground">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={editingRole.end_date}
                  onChange={(e) => setEditingRole({ ...editingRole, end_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveEditing}
                disabled={!editingRole.title.trim()}
              >
                <Check size={16} className="mr-1" />
                Save
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card
        className={cn(
          "p-5 transition-all",
          isActive && "ring-2 ring-primary/50",
          isArchived && "opacity-60"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Color indicator */}
          <div
            className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: role.color }}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{role.title}</h3>
              {isActive && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            {role.company && (
              <p className="text-sm text-muted-foreground">{role.company}</p>
            )}
            {role.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {role.description}
              </p>
            )}
            {(role.start_date || role.end_date) && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Calendar size={12} />
                <span>
                  {role.start_date ? format(new Date(role.start_date), "MMM yyyy") : "—"}
                  {" → "}
                  {role.end_date ? format(new Date(role.end_date), "MMM yyyy") : "Present"}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!isArchived && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startEditing(role)}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleArchive(role)}
                >
                  <Archive size={14} />
                </Button>
              </>
            )}
            {isArchived && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRestore(role)}
              >
                <ArchiveRestore size={14} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirmId(role.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div
          className="flex items-start justify-between mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <div>
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Briefcase size={18} className="text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Settings
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">Manage Roles</h1>
            <p className="text-muted-foreground mt-2">
              Add, edit, or archive your career roles. Each role organizes your journal entries separately.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus size={16} />
            New Role
          </Button>
        </div>

        {/* Active Roles */}
        <div
          className="mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Active Roles ({activeRoles.length})
          </h2>
          {activeRoles.length === 0 ? (
            <Card className="p-8 text-center">
              <Briefcase className="mx-auto mb-3 text-muted-foreground" size={32} />
              <p className="text-muted-foreground mb-4">
                No active roles yet. Create your first role to start journaling.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="gap-2">
                <Plus size={16} />
                Create Role
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeRoles.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          )}
        </div>

        {/* Archived Roles */}
        {archivedRoles.length > 0 && (
          <div
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Archived Roles ({archivedRoles.length})
            </h2>
            <div className="space-y-3">
              {archivedRoles.map((role) => (
                <RoleCard key={role.id} role={role} isArchived />
              ))}
            </div>
          </div>
        )}
      </main>

      <CreateRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{roleToDelete?.title}"? This will permanently remove
              the role and all associated journal entries, weekly reflections, and quarterly patterns.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Roles;

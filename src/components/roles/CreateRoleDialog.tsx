import { useState } from "react";
import { useRoles } from "@/contexts/RolesContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Briefcase } from "lucide-react";

const roleColors = [
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#06b6d4", // cyan
  "#84cc16", // lime
];

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRoleDialog = ({ open, onOpenChange }: CreateRoleDialogProps) => {
  const { createRole } = useRoles();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(roleColors[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    
    const role = await createRole({
      title: title.trim(),
      company: company.trim() || null,
      description: description.trim() || null,
      start_date: null,
      end_date: null,
      is_active: true,
      color,
    });

    setIsSubmitting(false);

    if (role) {
      setTitle("");
      setCompany("");
      setDescription("");
      setColor(roleColors[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Create a Role</DialogTitle>
          <DialogDescription>
            Add a new career role to organize your journal entries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Role Title <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl",
                "bg-secondary/30 border border-border/50",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
            />
          </div>

          {/* Company */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Company / Organization
            </label>
            <input
              type="text"
              placeholder="e.g., Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl",
                "bg-secondary/30 border border-border/50",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Brief Description
            </label>
            <textarea
              placeholder="What are your main responsibilities?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={cn(
                "w-full px-4 py-3 rounded-xl resize-none",
                "bg-secondary/30 border border-border/50",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Color Tag
            </label>
            <div className="flex gap-2">
              {roleColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color === c && "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={!title.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

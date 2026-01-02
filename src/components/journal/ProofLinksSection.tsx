import { useState } from "react";
import { Plus, Link2, Trash2, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProofLink } from "./JournalEntryForm";

interface ProofLinksSectionProps {
  links: ProofLink[];
  onLinksChange: (links: ProofLink[]) => void;
}

const linkTypes = [
  { id: "github", label: "GitHub", icon: Github },
  { id: "jira", label: "Jira", icon: Link2 },
  { id: "confluence", label: "Confluence", icon: Link2 },
  { id: "slack", label: "Slack", icon: Link2 },
  { id: "other", label: "Other", icon: ExternalLink },
] as const;

export const ProofLinksSection = ({ links, onLinksChange }: ProofLinksSectionProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState<Partial<ProofLink>>({
    type: "github",
    url: "",
    title: "",
  });

  const handleAddLink = () => {
    if (!newLink.url || !newLink.title) return;

    const link: ProofLink = {
      id: crypto.randomUUID(),
      type: newLink.type || "other",
      url: newLink.url,
      title: newLink.title,
    };

    onLinksChange([...links, link]);
    setNewLink({ type: "github", url: "", title: "" });
    setIsAdding(false);
  };

  const handleRemoveLink = (id: string) => {
    onLinksChange(links.filter((link) => link.id !== id));
  };

  const getLinkIcon = (type: ProofLink["type"]) => {
    const linkType = linkTypes.find((lt) => lt.id === type);
    return linkType?.icon || Link2;
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-lg font-semibold">Proof & References</h3>
          <p className="text-sm text-muted-foreground">Link to commits, tickets, or docs</p>
        </div>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-2"
          >
            <Plus size={16} />
            Add Link
          </Button>
        )}
      </div>

      {/* Existing Links */}
      {links.length > 0 && (
        <div className="space-y-2 mb-4">
          {links.map((link) => {
            const Icon = getLinkIcon(link.type);
            return (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 group"
              >
                <div className="p-2 rounded-lg bg-secondary/50">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{link.title}</p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary truncate block"
                  >
                    {link.url}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLink(link.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                >
                  <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Link Form */}
      {isAdding && (
        <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-3">
          {/* Link Type Selector */}
          <div className="flex flex-wrap gap-2">
            {linkTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setNewLink((prev) => ({ ...prev, type: type.id }))}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  newLink.type === type.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* URL Input */}
          <input
            type="url"
            placeholder="https://github.com/..."
            value={newLink.url || ""}
            onChange={(e) => setNewLink((prev) => ({ ...prev, url: e.target.value }))}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-secondary/30 border border-border/50",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/30"
            )}
          />

          {/* Title Input */}
          <input
            type="text"
            placeholder="Brief description (e.g., 'Fixed auth bug')"
            value={newLink.title || ""}
            onChange={(e) => setNewLink((prev) => ({ ...prev, title: e.target.value }))}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-secondary/30 border border-border/50",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/30"
            )}
          />

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewLink({ type: "github", url: "", title: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAddLink}
              disabled={!newLink.url || !newLink.title}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {links.length === 0 && !isAdding && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Link2 size={24} className="mx-auto mb-2 opacity-40" />
          <p>No proof links added yet</p>
        </div>
      )}
    </div>
  );
};

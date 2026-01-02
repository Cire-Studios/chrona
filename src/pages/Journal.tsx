import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { JournalEntryForm } from "@/components/journal/JournalEntryForm";
import { RoleSelector } from "@/components/roles/RoleSelector";
import { ArrowLeft, Calendar, Save, CheckCircle, LogOut, Sparkles, LayoutDashboard } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";
import { supabase } from "@/integrations/supabase/client";

export interface JournalEntryData {
  accomplishments: string;
  decisions: string;
  challenges: string;
  learnings: string;
  proofLinks: ProofLinkData[];
  images: ImageFileData[];
}

export interface ProofLinkData {
  id: string;
  type: "github" | "jira" | "confluence" | "slack" | "other";
  url: string;
  title: string;
}

export interface ImageFileData {
  id: string;
  file?: File;
  preview: string;
  caption: string;
  imageUrl?: string;
}

const Journal = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { activeRole, loading: rolesLoading } = useRoles();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [entryData, setEntryData] = useState<JournalEntryData>({
    accomplishments: "",
    decisions: "",
    challenges: "",
    learnings: "",
    proofLinks: [],
    images: [],
  });
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const todayDate = new Date().toISOString().split("T")[0];

  // Load existing entry for today when role changes
  useEffect(() => {
    const loadExistingEntry = async () => {
      if (!user || !activeRole) return;

      try {
        const { data: entry, error } = await supabase
          .from("journal_entries")
          .select("*")
          .eq("role_id", activeRole.id)
          .eq("entry_date", todayDate)
          .maybeSingle();

        if (error) throw error;

        if (entry) {
          setExistingEntryId(entry.id);
          setEntryData({
            accomplishments: entry.accomplishments || "",
            decisions: entry.decisions || "",
            challenges: entry.challenges || "",
            learnings: entry.learnings || "",
            proofLinks: [],
            images: [],
          });

          // Load proof links
          const { data: links } = await supabase
            .from("proof_links")
            .select("*")
            .eq("entry_id", entry.id);

          if (links) {
            setEntryData((prev) => ({
              ...prev,
              proofLinks: links.map((l) => ({
                id: l.id,
                type: l.link_type as ProofLinkData["type"],
                url: l.url,
                title: l.title,
              })),
            }));
          }

          // Load images
          const { data: images } = await supabase
            .from("entry_images")
            .select("*")
            .eq("entry_id", entry.id);

          if (images) {
            setEntryData((prev) => ({
              ...prev,
              images: images.map((img) => ({
                id: img.id,
                preview: img.image_url,
                caption: img.caption || "",
                imageUrl: img.image_url,
              })),
            }));
          }
        } else {
          // Reset form for new entry
          setExistingEntryId(null);
          setEntryData({
            accomplishments: "",
            decisions: "",
            challenges: "",
            learnings: "",
            proofLinks: [],
            images: [],
          });
        }
      } catch (error) {
        console.error("Error loading entry:", error);
      }
    };

    loadExistingEntry();
  }, [user, activeRole, todayDate]);

  const handleSave = async () => {
    if (!user || !activeRole) {
      toast({
        title: "Error",
        description: "Please select a role before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let entryId = existingEntryId;

      if (existingEntryId) {
        // Update existing entry
        const { error } = await supabase
          .from("journal_entries")
          .update({
            accomplishments: entryData.accomplishments,
            decisions: entryData.decisions,
            challenges: entryData.challenges,
            learnings: entryData.learnings,
          })
          .eq("id", existingEntryId);

        if (error) throw error;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            role_id: activeRole.id,
            entry_date: todayDate,
            accomplishments: entryData.accomplishments,
            decisions: entryData.decisions,
            challenges: entryData.challenges,
            learnings: entryData.learnings,
          })
          .select()
          .single();

        if (error) throw error;
        entryId = data.id;
        setExistingEntryId(data.id);
      }

      // Handle proof links - delete old ones and insert new
      if (entryId) {
        await supabase.from("proof_links").delete().eq("entry_id", entryId);

        if (entryData.proofLinks.length > 0) {
          const { error: linksError } = await supabase.from("proof_links").insert(
            entryData.proofLinks.map((link) => ({
              entry_id: entryId,
              user_id: user.id,
              link_type: link.type,
              url: link.url,
              title: link.title,
            }))
          );

          if (linksError) throw linksError;
        }
      }

      setIsSaved(true);
      toast({
        title: "Entry saved",
        description: "Your journal entry has been captured successfully.",
      });
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Redirect to auth if not logged in
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <Logo size="sm" />
          </div>

          <div className="flex-1 flex justify-center">
            <RoleSelector />
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <Link to="/weekly">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Sparkles size={16} />
                <span className="hidden sm:inline">Weekly</span>
              </Button>
            </Link>
            <Button
              variant={isSaved ? "outline" : "hero"}
              onClick={handleSave}
              disabled={isSaving || !activeRole}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <span className="animate-pulse">Saving...</span>
              ) : isSaved ? (
                <>
                  <CheckCircle size={18} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Entry
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Date Header */}
        <div
          className="mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Calendar size={18} className="text-primary" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Daily Capture
            </span>
            {activeRole && (
              <>
                <span className="text-border">•</span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeRole.color }}
                />
                <span className="text-sm">{activeRole.title}</span>
              </>
            )}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">{today}</h1>
        </div>

        {/* No Role Warning */}
        {!activeRole && (
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center mb-8">
            <p className="text-muted-foreground mb-4">
              Create a role to start journaling. Roles help you organize entries
              by different positions or jobs.
            </p>
          </div>
        )}

        {/* Journal Form */}
        {activeRole && (
          <div
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <JournalEntryForm
              entryData={entryData}
              onEntryChange={setEntryData}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Journal;

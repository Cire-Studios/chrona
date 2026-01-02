import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FileText, Globe, Lock, Trash2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Resume {
  id: string;
  title: string;
  is_public: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
}

const Resumes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchResumes();
  }, [user]);

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      toast.error("Failed to load resumes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) throw error;
      setResumes(resumes.filter((r) => r.id !== id));
      toast.success("Resume deleted");
    } catch (error) {
      toast.error("Failed to delete resume");
    }
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resumes</h1>
            <p className="text-muted-foreground mt-1">Create and manage your verified resumes</p>
          </div>
          <Button onClick={() => navigate("/resume/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Resume
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : resumes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-4">Create your first AI-powered resume backed by verified achievements</p>
              <Button onClick={() => navigate("/resume/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {resume.title}
                        {resume.is_public ? (
                          <Badge variant="default" className="text-xs"><Globe className="h-3 w-3 mr-1" />Public</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />Private</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Updated {format(new Date(resume.updated_at), "MMM d, yyyy")}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {resume.is_public && resume.public_slug && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => copyLink(resume.public_slug!)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/r/${resume.public_slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(resume.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" asChild>
                    <Link to={`/resume/${resume.id}`}>Edit Resume</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Resumes;

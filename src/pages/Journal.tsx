import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { JournalEntryForm } from "@/components/journal/JournalEntryForm";
import { ArrowLeft, Calendar, Save, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Journal = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save - replace with actual save logic when Cloud is connected
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsSaved(true);
    toast({
      title: "Entry saved",
      description: "Your journal entry has been captured successfully.",
    });
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <Logo size="sm" />
          </div>
          
          <Button 
            variant={isSaved ? "outline" : "hero"} 
            onClick={handleSave}
            disabled={isSaving}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Date Header */}
        <div className="mb-8 opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Calendar size={18} className="text-primary" />
            <span className="text-sm font-medium uppercase tracking-wider">Daily Capture</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">{today}</h1>
        </div>

        {/* Journal Form */}
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
          <JournalEntryForm />
        </div>
      </main>
    </div>
  );
};

export default Journal;

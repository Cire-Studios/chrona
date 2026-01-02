import { Crown, Star } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const TierBadge = () => {
  const { tier, loading } = useSubscription();

  if (loading) return null;

  const isChronicler = tier === "chronicler";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-1 text-xs font-medium transition-all",
        isChronicler
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border bg-secondary/50 text-muted-foreground"
      )}
    >
      {isChronicler ? (
        <>
          <Crown size={12} className="text-primary" />
          Chronicler
        </>
      ) : (
        <>
          <Star size={12} />
          Starter
        </>
      )}
    </Badge>
  );
};

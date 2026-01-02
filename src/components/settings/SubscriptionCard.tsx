import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Check, Sparkles, Image, Briefcase, Settings } from "lucide-react";

export const SubscriptionCard = () => {
  const { 
    tier, 
    loading, 
    artifactUsage, 
    roleCount, 
    openCheckout, 
    openCustomerPortal 
  } = useSubscription();

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isChronicler = tier === "chronicler";

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className={isChronicler ? "h-5 w-5 text-amber-500" : "h-5 w-5 text-muted-foreground"} />
              Subscription
            </CardTitle>
            <CardDescription>
              Manage your Chrona subscription
            </CardDescription>
          </div>
          <Badge variant={isChronicler ? "default" : "secondary"} className="text-sm">
            {isChronicler ? "Chronicler" : "Starter"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChronicler ? (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Artifacts
                </span>
                <span className="text-sm font-medium">
                  {artifactUsage.currentMonth}/50 this month
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Roles
                </span>
                <span className="text-sm font-medium">{roleCount} (unlimited)</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm flex items-center gap-2">
                  <Image className="h-4 w-4 text-primary" />
                  Image Uploads
                </span>
                <span className="text-sm font-medium text-green-600">Enabled</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={openCustomerPortal}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  AI Artifacts
                </span>
                <span className="text-sm font-medium">
                  {artifactUsage.lifetime}/3 lifetime
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Roles
                </span>
                <span className="text-sm font-medium">{roleCount}/1</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  Image Uploads
                </span>
                <span className="text-sm font-medium text-muted-foreground">Not available</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 mt-4">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Upgrade to Chronicler
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  50 AI artifact generations/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  Unlimited career roles
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  Image uploads in journal entries
                </li>
              </ul>
              <div className="flex gap-2">
                <Button 
                  variant="hero" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openCheckout("month")}
                >
                  $7/month
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openCheckout("year")}
                >
                  $72/year (save 14%)
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

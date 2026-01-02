import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type UserTier = "starter" | "chronicler";

interface SubscriptionContextType {
  tier: UserTier;
  loading: boolean;
  artifactUsage: {
    lifetime: number;
    currentMonth: number;
  };
  roleCount: number;
  canGenerateArtifact: boolean;
  canUploadImages: boolean;
  canCreateRole: boolean;
  remainingArtifacts: number | "unlimited";
  checkSubscription: () => Promise<void>;
  recordArtifactUsage: (roleId: string) => Promise<boolean>;
  openCheckout: (interval: "month" | "year") => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Stripe price IDs for Chronicler tier (production)
const STRIPE_PRICES = {
  monthly: "price_1Sl7YKRubN3E3b7eWGAIY17R",
  yearly: "price_1Sl7YVRubN3E3b7eXRgIR8GO",
};

// Tier limits
const TIER_LIMITS = {
  starter: {
    artifactLifetime: 3,
    roles: 1,
    imagesAllowed: false,
  },
  chronicler: {
    artifactMonthly: 50,
    roles: Infinity,
    imagesAllowed: true,
  },
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tier, setTier] = useState<UserTier>("starter");
  const [loading, setLoading] = useState(true);
  const [artifactUsage, setArtifactUsage] = useState({ lifetime: 0, currentMonth: 0 });
  const [roleCount, setRoleCount] = useState(0);

  const fetchSubscriptionData = useCallback(async () => {
    if (!user) {
      setTier("starter");
      setArtifactUsage({ lifetime: 0, currentMonth: 0 });
      setRoleCount(0);
      setLoading(false);
      return;
    }

    try {
      // Fetch subscription status from Stripe via edge function
      const { data: subscriptionData, error: subError } = await supabase.functions.invoke(
        "check-subscription"
      );

      if (subError) {
        console.error("Error checking subscription:", subError);
      } else if (subscriptionData?.subscribed) {
        setTier("chronicler");
      } else {
        setTier("starter");
      }

      // Fetch artifact usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: lifetimeCount } = await supabase
        .from("artifact_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: monthCount } = await supabase
        .from("artifact_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      setArtifactUsage({
        lifetime: lifetimeCount || 0,
        currentMonth: monthCount || 0,
      });

      // Fetch role count (active + archived, not deleted)
      const { count: roles } = await supabase
        .from("roles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setRoleCount(roles || 0);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptionData();
    
    // Refresh subscription status periodically (every minute)
    const interval = setInterval(fetchSubscriptionData, 60000);
    return () => clearInterval(interval);
  }, [fetchSubscriptionData]);

  // Calculate permissions based on tier
  const canGenerateArtifact = tier === "chronicler"
    ? artifactUsage.currentMonth < TIER_LIMITS.chronicler.artifactMonthly
    : artifactUsage.lifetime < TIER_LIMITS.starter.artifactLifetime;

  const canUploadImages = tier === "chronicler";

  const canCreateRole = tier === "chronicler" || roleCount < TIER_LIMITS.starter.roles;

  const remainingArtifacts = tier === "chronicler"
    ? TIER_LIMITS.chronicler.artifactMonthly - artifactUsage.currentMonth
    : TIER_LIMITS.starter.artifactLifetime - artifactUsage.lifetime;

  const recordArtifactUsage = async (roleId: string): Promise<boolean> => {
    if (!user || !canGenerateArtifact) return false;

    try {
      const { error } = await supabase.from("artifact_usage").insert({
        user_id: user.id,
        role_id: roleId,
      });

      if (error) throw error;

      // Update local state
      setArtifactUsage((prev) => ({
        lifetime: prev.lifetime + 1,
        currentMonth: prev.currentMonth + 1,
      }));

      return true;
    } catch (error) {
      console.error("Error recording artifact usage:", error);
      return false;
    }
  };

  const openCheckout = async (interval: "month" | "year") => {
    try {
      const priceId = interval === "month" ? STRIPE_PRICES.monthly : STRIPE_PRICES.yearly;
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening checkout:", error);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        loading,
        artifactUsage,
        roleCount,
        canGenerateArtifact,
        canUploadImages,
        canCreateRole,
        remainingArtifacts,
        checkSubscription: fetchSubscriptionData,
        recordArtifactUsage,
        openCheckout,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PasswordSetupGateProps {
  children: React.ReactNode;
}

export const PasswordSetupGate = ({ children }: PasswordSetupGateProps) => {
  const { user, loading, needsPasswordSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User needs to set up password - redirect to auth for password setup
  if (needsPasswordSetup) {
    return <Navigate to="/auth" state={{ from: location, needsPassword: true }} replace />;
  }

  return <>{children}</>;
};

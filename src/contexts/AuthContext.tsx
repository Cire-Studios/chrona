import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  needsPasswordSetup: boolean;
  sendOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkUserExists: (email: string) => Promise<{ exists: boolean; hasPassword: boolean }>;
  setPassword: (password: string) => Promise<{ error: Error | null }>;
  setNeedsPasswordSetup: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check if user needs password setup after login
        if (session?.user) {
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("has_password")
              .eq("user_id", session.user.id)
              .maybeSingle();
            
            if (profile && !profile.has_password) {
              setNeedsPasswordSetup(true);
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check if user needs password setup
      if (session?.user) {
        supabase
          .from("profiles")
          .select("has_password")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile && !profile.has_password) {
              setNeedsPasswordSetup(true);
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserExists = async (email: string): Promise<{ exists: boolean; hasPassword: boolean }> => {
    // Try to send OTP with shouldCreateUser: false to check if user exists
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });
    
    if (error?.message?.includes("Signups not allowed")) {
      // User doesn't exist
      return { exists: false, hasPassword: false };
    }
    
    // User exists - we can't easily check hasPassword without signing in
    // Return exists: true and let the login flow handle password check
    return { exists: true, hasPassword: true };
  };

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/journal`,
      },
    });
    return { error: error as Error | null };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const setPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    
    if (!error && user) {
      // Update profile to mark password as set
      await supabase
        .from("profiles")
        .update({ has_password: true })
        .eq("user_id", user.id);
      
      setNeedsPasswordSetup(false);
    }
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Even if server signout fails (e.g., session already expired),
      // clear local state to allow user to sign in again
      console.warn("Sign out error (session may have already expired):", error);
    } finally {
      // Always clear local state
      setSession(null);
      setUser(null);
      setNeedsPasswordSetup(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      needsPasswordSetup,
      sendOtp, 
      verifyOtp, 
      signIn, 
      signOut,
      checkUserExists,
      setPassword,
      setNeedsPasswordSetup
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

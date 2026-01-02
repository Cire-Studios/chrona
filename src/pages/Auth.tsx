import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthStep = "form" | "magic-link-sent" | "password-setup";

const Auth = () => {
  const { 
    user, 
    loading, 
    signIn, 
    sendOtp, 
    checkUserExists,
    setPassword: updatePassword,
    needsPasswordSetup,
    setNeedsPasswordSetup
  } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<AuthStep>("form");

  // Redirect if already logged in and doesn't need password setup
  if (user && !loading && !needsPasswordSetup) {
    return <Navigate to="/journal" replace />;
  }

  // Show password setup if user is logged in but needs to set password
  if (user && needsPasswordSetup && step !== "password-setup") {
    setStep("password-setup");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      // Login with password
      const result = loginSchema.safeParse({ email, password: passwordValue });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }
    } else {
      // Sign up - validate email only
      const result = signupSchema.safeParse({ email });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, passwordValue);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setError("Invalid email or password. Please try again.");
          } else {
            setError(error.message);
          }
          return;
        }
        navigate("/journal");
      } else {
        // Check if user already exists
        const { exists } = await checkUserExists(email);
        
        if (exists) {
          setError("An account with this email already exists. Please sign in instead.");
          return;
        }
        
        // Send magic link for new user
        const { error } = await sendOtp(email);
        if (error) {
          setError(error.message);
          return;
        }
        setStep("magic-link-sent");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = passwordSchema.safeParse({ password: passwordValue, confirmPassword });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(passwordValue);
      if (error) {
        setError(error.message);
        return;
      }
      navigate("/journal");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
      
      {/* Header */}
      <PublicHeader />

      {/* Auth Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {step === "password-setup" ? (
            // Password Setup Step
            <div className="opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                  Set up your password
                </h1>
                <p className="text-muted-foreground">
                  Create a password to secure your account and make future logins easier.
                </p>
              </div>

              <form onSubmit={handlePasswordSetup} className="space-y-4">
                {/* Password Input */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password (min 8 characters)"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    className={cn(
                      "w-full pl-12 pr-12 py-3.5 rounded-xl",
                      "bg-secondary/30 border border-border/50",
                      "text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                      "transition-all duration-300"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password Input */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "w-full pl-12 pr-12 py-3.5 rounded-xl",
                      "bg-secondary/30 border border-border/50",
                      "text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                      "transition-all duration-300"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Setting up...</span>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight size={20} />
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : step === "magic-link-sent" ? (
            // Magic Link Sent Step
            <div className="text-center opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                Check your email
              </h1>
              <p className="text-muted-foreground mb-6">
                We sent a magic link to <span className="text-foreground font-medium">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Click the link in the email to sign in. After signing in, you'll be prompted to set up a password for future logins.
              </p>

              <div className="flex items-center justify-center gap-4 text-sm">
                <button
                  onClick={() => {
                    setStep("form");
                    setError("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <span className="text-muted-foreground/50">|</span>
                <button
                  onClick={async () => {
                    setIsSubmitting(true);
                    const { error } = await sendOtp(email);
                    setIsSubmitting(false);
                    if (error) {
                      setError(error.message);
                    }
                  }}
                  disabled={isSubmitting}
                  className="text-primary hover:underline"
                >
                  Resend email
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8 opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
                <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                  {isLogin ? "Welcome back" : "Start your journey"}
                </h1>
                <p className="text-muted-foreground">
                  {isLogin
                    ? "Sign in to continue documenting your career"
                    : "Create your account to start journaling"}
                </p>
              </div>

              <form 
                onSubmit={handleSubmit} 
                className="space-y-4 opacity-0 animate-fade-up" 
                style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
              >
                {/* Email Input */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3.5 rounded-xl",
                      "bg-secondary/30 border border-border/50",
                      "text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                      "transition-all duration-300"
                    )}
                  />
                </div>

                {/* Password Input - only shown for login */}
                {isLogin && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      className={cn(
                        "w-full pl-12 pr-12 py-3.5 rounded-xl",
                        "bg-secondary/30 border border-border/50",
                        "text-foreground placeholder:text-muted-foreground/50",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                        "transition-all duration-300"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">
                      {isLogin ? "Signing in..." : "Sending link..."}
                    </span>
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Continue with Email"}
                      <ArrowRight size={20} />
                    </>
                  )}
                </Button>
              </form>

              {/* Toggle Login/Signup */}
              <div className="text-center mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <p className="text-muted-foreground text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                      setPasswordValue("");
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Auth;
import { useState, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type AuthStep = "form" | "otp";

const Auth = () => {
  const { user, loading, signIn, sendOtp, verifyOtp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<AuthStep>("form");
  const [otpValue, setOtpValue] = useState("");

  // Redirect if already logged in
  if (user && !loading) {
    return <Navigate to="/journal" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      // Login with password
      const result = loginSchema.safeParse({ email, password });
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
        const { error } = await signIn(email, password);
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
        // Send OTP for signup
        const { error } = await sendOtp(email);
        if (error) {
          if (error.message.includes("already registered")) {
            setError("This email is already registered. Please sign in instead.");
          } else {
            setError(error.message);
          }
          return;
        }
        setStep("otp");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const { error } = await verifyOtp(email, otpValue);
      if (error) {
        if (error.message.includes("expired")) {
          setError("Code expired. Please request a new one.");
        } else if (error.message.includes("invalid")) {
          setError("Invalid code. Please check and try again.");
        } else {
          setError(error.message);
        }
        return;
      }
      navigate("/journal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const { error } = await sendOtp(email);
      if (error) {
        setError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
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
          {step === "otp" ? (
            // OTP Verification Step
            <div className="text-center opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                Enter verification code
              </h1>
              <p className="text-muted-foreground mb-8">
                We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
              </p>

              <div className="flex justify-center mb-6">
                <InputOTP
                  value={otpValue}
                  onChange={setOtpValue}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4">
                  {error}
                </div>
              )}

              <Button
                onClick={handleVerifyOtp}
                variant="hero"
                size="xl"
                className="w-full mb-4"
                disabled={isSubmitting || otpValue.length !== 6}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Verifying...</span>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight size={20} />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-sm">
                <button
                  onClick={() => {
                    setStep("form");
                    setOtpValue("");
                    setError("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <span className="text-muted-foreground/50">|</span>
                <button
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="text-primary hover:underline"
                >
                  Resend code
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

              {/* Google Sign-in Button */}
              <div className="opacity-0 animate-fade-up" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  className="w-full mb-4"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </div>

              <form 
                onSubmit={handleSubmit} 
                className="space-y-4 opacity-0 animate-fade-up" 
                style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      {isLogin ? "Signing in..." : "Sending code..."}
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
              <div className="text-center mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
                <p className="text-muted-foreground text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
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

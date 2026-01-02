import { Toaster } from "@/components/ui/toaster";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RolesProvider } from "@/contexts/RolesContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { PasswordSetupGate } from "@/components/auth/PasswordSetupGate";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import WeeklyReflection from "./pages/WeeklyReflection";
import QuarterlyDistillation from "./pages/QuarterlyDistillation";
import Artifacts from "./pages/Artifacts";
import Roles from "./pages/Roles";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Resumes from "./pages/Resumes";
import ResumeBuilder from "./pages/ResumeBuilder";
import PublicResume from "./pages/PublicResume";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RolesProvider>
          <SubscriptionProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/features" element={<Features />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Protected routes - require auth + password setup */}
                <Route path="/dashboard" element={<PasswordSetupGate><Dashboard /></PasswordSetupGate>} />
                <Route path="/journal" element={<PasswordSetupGate><Journal /></PasswordSetupGate>} />
                <Route path="/weekly" element={<PasswordSetupGate><WeeklyReflection /></PasswordSetupGate>} />
                <Route path="/quarterly" element={<PasswordSetupGate><QuarterlyDistillation /></PasswordSetupGate>} />
                <Route path="/artifacts" element={<PasswordSetupGate><Artifacts /></PasswordSetupGate>} />
                <Route path="/roles" element={<PasswordSetupGate><Roles /></PasswordSetupGate>} />
                <Route path="/timeline" element={<PasswordSetupGate><Timeline /></PasswordSetupGate>} />
                <Route path="/settings" element={<PasswordSetupGate><Settings /></PasswordSetupGate>} />
                <Route path="/resumes" element={<PasswordSetupGate><Resumes /></PasswordSetupGate>} />
                <Route path="/resume/new" element={<PasswordSetupGate><ResumeBuilder /></PasswordSetupGate>} />
                <Route path="/resume/:id" element={<PasswordSetupGate><ResumeBuilder /></PasswordSetupGate>} />
                
                {/* Public resume page - no auth required */}
                <Route path="/r/:slug" element={<PublicResume />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SubscriptionProvider>
        </RolesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

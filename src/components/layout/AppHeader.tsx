import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/UserMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { 
  PenLine, 
  Sparkles, 
  Layers,
  FileText,
  TrendingUp,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: "/journal", label: "Journal", icon: PenLine },
  { path: "/weekly", label: "Weekly", icon: Sparkles },
  { path: "/quarterly", label: "Quarterly", icon: Layers },
  { path: "/artifacts", label: "Artifacts", icon: FileText },
  { path: "/resumes", label: "Resumes", icon: FileText },
  { path: "/timeline", label: "Timeline", icon: TrendingUp },
];

export const AppHeader = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Nav + Logo */}
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link to="/dashboard" className="flex-shrink-0">
              <Logo size="sm" />
            </Link>
          </div>

          {/* Navigation - Center (Desktop only) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { RoleSelector } from "@/components/roles/RoleSelector";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LogOut, 
  LayoutDashboard, 
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
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/journal", label: "Journal", icon: PenLine },
  { path: "/weekly", label: "Weekly", icon: Sparkles },
  { path: "/quarterly", label: "Quarterly", icon: Layers },
  { path: "/artifacts", label: "Artifacts", icon: FileText },
  { path: "/timeline", label: "Timeline", icon: TrendingUp },
];

interface AppHeaderProps {
  showRoleSelector?: boolean;
}

export const AppHeader = ({ showRoleSelector = true }: AppHeaderProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/dashboard">
              <Logo size="sm" />
            </Link>
          </div>

          {/* Navigation - Center */}
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

          {/* Mobile Navigation */}
          <nav className="flex md:hidden items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={18} />
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {showRoleSelector && (
              <div className="hidden sm:block">
                <RoleSelector />
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>

        {/* Mobile Role Selector */}
        {showRoleSelector && (
          <div className="sm:hidden pb-3 -mt-1">
            <RoleSelector />
          </div>
        )}
      </div>
    </header>
  );
};

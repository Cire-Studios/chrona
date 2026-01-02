import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { 
  Menu,
  PenLine, 
  Sparkles, 
  Layers,
  FileText,
  TrendingUp,
  Briefcase,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: "/journal", label: "Journal", icon: PenLine },
  { path: "/weekly", label: "Weekly Reflection", icon: Sparkles },
  { path: "/quarterly", label: "Quarterly Distillation", icon: Layers },
  { path: "/artifacts", label: "Artifacts", icon: FileText },
  { path: "/timeline", label: "Timeline", icon: TrendingUp },
  { path: "/roles", label: "Manage Roles", icon: Briefcase },
];

export const MobileNav = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="text-left pb-6">
          <SheetTitle>
            <Link to="/dashboard" onClick={() => setOpen(false)}>
              <Logo size="sm" />
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

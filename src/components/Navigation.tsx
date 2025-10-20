import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sparkles, FolderOpen, TrendingUp, Activity, Bot, Menu, X, Video } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: "/create", label: "Create", icon: null },
    { to: "/media", label: "Media", icon: FolderOpen },
    { to: "/video-generation", label: "Video Studio", icon: Video },
    { to: "/analytics", label: "Analytics", icon: TrendingUp },
    { to: "/system-monitor", label: "Monitor", icon: Activity },
    { to: "/viral-bots", label: "Viral Bots", icon: Bot },
    { to: "/workflow", label: "Workflow", icon: null },
    { to: "/dashboard", label: "Dashboard", icon: null },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              StoryForge
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2 font-medium"
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  StoryForge
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                  >
                    {link.icon && <link.icon className="h-5 w-5 text-primary" />}
                    <span className="text-base font-medium">{link.label}</span>
                  </Link>
                ))}
                
                <div className="border-t border-border pt-4 mt-4 space-y-3">
                  <Link to="/auth" onClick={() => setIsOpen(false)} className="block">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth" onClick={() => setIsOpen(false)} className="block">
                    <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

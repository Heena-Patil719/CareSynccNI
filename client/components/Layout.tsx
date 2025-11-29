import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Activity,
  Database,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Chatbot } from "@/components/Chatbot";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n, type Language } from "@/contexts/I18nContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  const isActive = (path: string) => location.pathname === path;

  const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "hi", label: "हिन्दी" },
    { code: "ta", label: "தமிழ்" },
    { code: "te", label: "తెలుగు" },
    { code: "kn", label: "ಕನ್ನಡ" },
    { code: "ml", label: "മലയാളം" },
    { code: "mr", label: "मराठी" },
    { code: "gu", label: "ગુજરાતી" },
    { code: "bn", label: "বাংলা" },
    { code: "pa", label: "ਪੰਜਾਬੀ" },
    { code: "or", label: "ଓଡିଆ" },
    { code: "as", label: "অসমীয়া" },
    { code: "ur", label: "اردو" },
  ];

  // Only show navigation if authenticated
  const navigationItems = isAuthenticated
    ? [
        {
          name: t("dashboard"),
          path: "/",
          icon: Activity,
        },
        {
          name: t("codeMapping"),
          path: "/mapping",
          icon: Database,
        },
        {
          name: t("patients"),
          path: "/patients",
          icon: Users,
        },
       
      ]
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 font-display font-bold text-xl text-primary hover:text-secondary transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                CS
              </div>
              <span>Care Sync</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle - Always visible */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 px-0">
                    {theme === "light" ||
                    (theme === "system" &&
                      typeof window !== "undefined" &&
                      !window.matchMedia(
                        "(prefers-color-scheme: dark)"
                      ).matches) ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t("theme")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    {t("light")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    {t("dark")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    {t("system")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isAuthenticated && (
                <>
                  {/* Language Toggle */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 px-0">
                        <Globe className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <DropdownMenuItem
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                        >
                          {lang.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-9 px-0 rounded-full"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary text-white">
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        {user?.firstName} {user?.lastName}
                      </DropdownMenuLabel>
                      <p className="text-xs text-muted-foreground px-2">
                        {user?.email}
                      </p>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          {t("profile")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={logout}
                        className="text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t("logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {/* Mobile Menu Button */}
              {isAuthenticated && (
                <button
                  className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-border py-4 -mx-4 px-4 animate-slide-up">
              <div className="flex flex-col gap-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive(item.path)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>

      {/* Footer - Only show when authenticated */}
      {isAuthenticated && (
        <footer className="border-t border-border bg-muted/30 mt-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 font-display font-bold text-primary mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    CS
                  </div>
                  Care Sync
                </div>
                <p className="text-sm text-muted-foreground">
                  Mapping NAMASTE codes to ICD-11 with FHIR compliance.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-3">Features</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Code Mapping
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Patient Management
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      FHIR API
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-3">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-3">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2024 Care Sync. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}

      {/* Chatbot - Show when authenticated */}
      {isAuthenticated && <Chatbot />}
    </div>
  );
}

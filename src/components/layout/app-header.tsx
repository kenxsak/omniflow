"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrency } from "@/contexts/currency-context";
import { Icon } from "@iconify/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { KeyboardShortcutsModal, useKeyboardShortcuts } from "@/components/ui/keyboard-shortcuts-modal";

export default function AppHeader() {
  const { currency } = useCurrency();
  const { isMobile } = useSidebar();
  const { appUser, logout, impersonatingUser, stopImpersonation } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts();

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    router.push("/dashboard");
  };

  const userInitials = appUser?.name
    ? appUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : appUser?.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-10 flex h-12 items-center gap-2 px-4 transition-all duration-100",
          "bg-background"
        )}
      >
        {/* Mobile sidebar trigger */}
        {isMounted && isMobile && (
          <SidebarTrigger className="h-9 w-9 shrink-0" />
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Digital Card quick access - hidden on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/digital-card/manage")}
            title="Manage Digital Card"
          >
            <Icon icon="solar:smartphone-bold" className="h-3.5 w-3.5" />
            <span>Digital Card</span>
          </Button>

          {/* Keyboard shortcuts button - hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex h-8 w-8"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
          >
            <Icon icon="solar:keyboard-linear" className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Currency indicator - hidden on very small screens */}
          <div className="hidden xs:flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {currency === "INR" ? (
              <Icon icon="solar:wallet-money-linear" className="h-3.5 w-3.5" />
            ) : (
              <Icon icon="solar:dollar-minimalistic-linear" className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{currency}</span>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full p-0"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={(appUser as { photoURL?: string })?.photoURL || undefined}
                    alt={appUser?.name || "User"}
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-fade-in">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {appUser?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {appUser?.email || "Not signed in"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => router.push("/digital-card/manage")}
                className="cursor-pointer"
              >
                <Icon icon="solar:smartphone-linear" className="mr-2 h-4 w-4" />
                <span>Digital Card</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => router.push("/settings")}
                className="cursor-pointer"
              >
                <Icon icon="solar:settings-linear" className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <DropdownMenuShortcut>G S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setShowShortcuts(true)}
                className="cursor-pointer"
              >
                <Icon icon="solar:keyboard-linear" className="mr-2 h-4 w-4" />
                <span>Shortcuts</span>
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
                disabled={!appUser}
              >
                <Icon icon="solar:logout-2-linear" className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />

      {/* Impersonation banner */}
      {impersonatingUser && (
        <div className="sticky top-14 sm:top-16 z-10 animate-fade-down">
          <Alert
            variant="warning"
            className="rounded-none border-x-0 border-t-0 py-2"
          >
            <AlertDescription className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
              <div className="flex items-center gap-2">
                <Icon
                  icon="solar:user-check-linear"
                  className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
                />
                <span className="text-xs sm:text-sm font-semibold">
                  Impersonating {appUser?.email}
                </span>
              </div>
              <Button
                onClick={handleStopImpersonation}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
              >
                Return to Superadmin
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}

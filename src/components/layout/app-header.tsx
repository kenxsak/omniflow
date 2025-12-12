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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const { currency } = useCurrency();
  const { isMobile } = useSidebar();
  const { appUser, logout, impersonatingUser, stopImpersonation } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          "sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b px-3 sm:px-4 md:px-6 transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm"
            : "bg-background/80 backdrop-blur-sm"
        )}
      >
        {/* Mobile sidebar trigger */}
        {isMounted && isMobile && (
          <SidebarTrigger className="h-9 w-9 shrink-0" />
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Currency indicator - hidden on very small screens */}
          <div className="hidden xs:flex items-center gap-1 px-2 py-1.5 rounded-lg border bg-card text-xs sm:text-sm font-medium transition-colors hover:bg-muted">
            {currency === "INR" ? (
              <Icon
                icon="solar:wallet-money-linear"
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground"
              />
            ) : (
              <Icon
                icon="solar:dollar-minimalistic-linear"
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground"
              />
            )}
            <span className="hidden sm:inline">{currency}</span>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-background shadow-sm">
                  <AvatarImage
                    src={appUser?.photoURL || undefined}
                    alt={appUser?.name || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs sm:text-sm font-semibold">
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
                onSelect={() => router.push("/settings")}
                className="cursor-pointer"
              >
                <Icon icon="solar:settings-linear" className="mr-2 h-4 w-4" />
                <span>Settings</span>
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

      {/* Impersonation banner */}
      {impersonatingUser && (
        <div className="sticky top-14 sm:top-16 z-10 animate-fade-down">
          <Alert
            variant="destructive"
            className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 rounded-none border-x-0 border-t-0 py-2"
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
                className="text-amber-800 border-amber-300 hover:bg-amber-100 dark:text-amber-200 dark:border-amber-600 dark:hover:bg-amber-800 h-7 text-xs"
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

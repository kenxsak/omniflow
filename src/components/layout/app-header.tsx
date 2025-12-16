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

// Mac Command Key Icon
const MacCommandIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.5 3C15.57 3 14 4.57 14 6.5V8h-4V6.5C10 4.57 8.43 3 6.5 3S3 4.57 3 6.5S4.57 10 6.5 10H8v4H6.5C4.57 14 3 15.57 3 17.5S4.57 21 6.5 21s3.5-1.57 3.5-3.5V16h4v1.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5H16v-4h1.5c1.93 0 3.5-1.57 3.5-3.5S19.43 3 17.5 3M16 8V6.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S18.33 8 17.5 8zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5S8 5.67 8 6.5V8zm3.5 6v-4h4v4zm7.5 5c-.83 0-1.5-.67-1.5-1.5V16h1.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5m-11 0c-.83 0-1.5-.67-1.5-1.5S5.67 16 6.5 16H8v1.5c0 .83-.67 1.5-1.5 1.5" />
  </svg>
);

// Windows Keyboard Icon - adjusted viewBox to center the keyboard
const WindowsKeyboardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 9 32 22" className={className} fill="currentColor">
    <g>
      <path d="M7.5 23a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm15.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM10.5 23a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM6 20.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 17a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 13a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h1A.5.5 0 0 0 6 14v-.5a.5.5 0 0 0-.5-.5zm5.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5z" />
      <path d="M1 14a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4zm26-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V14a2 2 0 0 0-2-2" />
    </g>
  </svg>
);

export default function AppHeader() {
  const { currency } = useCurrency();
  const { isMobile } = useSidebar();
  const { appUser, logout, impersonatingUser, stopImpersonation } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts();

  useEffect(() => {
    setIsMounted(true);
    setIsMac(typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf("MAC") >= 0);

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
            className="hidden sm:inline-flex h-8 w-8 items-center justify-center"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
          >
            {isMac ? (
              <MacCommandIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <WindowsKeyboardIcon className="h-[18px] w-[18px] text-muted-foreground" />
            )}
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

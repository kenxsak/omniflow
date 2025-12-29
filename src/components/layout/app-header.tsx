"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppHeader() {
  const { isMobile } = useSidebar();
  const { appUser, logout, impersonatingUser, stopImpersonation } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4">
        {/* Left side - Mobile sidebar trigger */}
        <div className="flex items-center gap-3">
          {isMounted && isMobile && (
            <SidebarTrigger className="h-8 w-8 shrink-0" />
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">


          {/* User menu - Clerk style */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative h-8 w-8 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2">
                <Avatar className="h-8 w-8 border-2 border-stone-200 dark:border-stone-700 transition-all hover:border-stone-300 dark:hover:border-stone-600">
                  <AvatarImage
                    src={(appUser as { photoURL?: string })?.photoURL || undefined}
                    alt={appUser?.name || "User"}
                  />
                  <AvatarFallback className="bg-stone-100 dark:bg-stone-800 text-foreground text-[10px] font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 p-0 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-xl shadow-lg overflow-hidden"
              sideOffset={8}
            >
              {/* User Info Section */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-stone-200 dark:border-stone-700">
                    <AvatarImage
                      src={(appUser as { photoURL?: string })?.photoURL || undefined}
                      alt={appUser?.name || "User"}
                    />
                    <AvatarFallback className="bg-stone-100 dark:bg-stone-800 text-foreground text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {appUser?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {appUser?.email || "Not signed in"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2 space-y-0.5">
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-foreground rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <Icon icon="solar:settings-linear" className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </button>

              </div>

              {/* Sign Out */}
              <div className="p-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  onClick={handleLogout}
                  disabled={!appUser}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-foreground rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  <Icon icon="solar:logout-2-linear" className="h-4 w-4 text-muted-foreground" />
                  <span>Sign out</span>
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Impersonation banner */}
      {impersonatingUser && (
        <div className="sticky top-14 z-10">
          <div className="flex items-center justify-center gap-4 py-2 px-4 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2 text-xs">
              <Icon icon="solar:user-check-linear" className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Impersonating {appUser?.email}</span>
            </div>
            <Button
              onClick={handleStopImpersonation}
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2"
            >
              Return to Superadmin
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

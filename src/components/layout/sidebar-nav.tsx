"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import gsap from "gsap";
import {
  MENU_CONFIG,
  SUPER_ADMIN_MENU,
  BADGE_STYLES,
  getEffectiveBadge,
  type MenuItem,
  type BadgeType,
  type PlanTier,
} from "@/lib/menu-config";
import { LockedFeatureModal } from "./locked-feature-modal";
import { SidebarUpgradeBanner } from "./sidebar-upgrade-banner";
import { QuickActions } from "./quick-actions";

interface MenuItemState {
  item: MenuItem;
  isAccessible: boolean;
  isLocked: boolean;
}

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const { isSuperAdmin, appUser, company } = useAuth();
  const { isFeatureEnabled } = useFeatureFlag();
  const [menuItems, setMenuItems] = useState<MenuItemState[]>([]);
  const menuRef = useRef<HTMLUListElement>(null);

  // Locked feature modal state
  const [lockedModal, setLockedModal] = useState<{
    isOpen: boolean;
    featureName: string;
    featureIcon: string;
    minPlan: PlanTier;
    featureId?: string;
  }>({
    isOpen: false,
    featureName: "",
    featureIcon: "",
    minPlan: "starter",
  });

  const isAdmin = appUser?.role === "admin" || appUser?.role === "superadmin";

  // Prefetch routes on hover for instant navigation
  const prefetchRoute = useCallback(
    (href: string) => {
      if (href && href !== "#" && !href.startsWith("http")) {
        router.prefetch(href);
      }
    },
    [router]
  );

  // Prefetch all main routes on mount for instant navigation
  useEffect(() => {
    const prefetchMainRoutes = () => {
      const mainRoutes = [
        "/dashboard",
        "/crm",
        "/tasks",
        "/campaigns",
        "/social-media",
        "/settings",
      ];
      mainRoutes.forEach((route) => {
        router.prefetch(route);
      });
    };
    const timer = setTimeout(prefetchMainRoutes, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  // Process menu items with feature flag checks
  useEffect(() => {
    const processMenuItems = async () => {
      if (isSuperAdmin) {
        // Super admin gets their own menu
        setMenuItems(
          SUPER_ADMIN_MENU.map((item) => ({
            item,
            isAccessible: true,
            isLocked: false,
          }))
        );
        return;
      }

      const processedItems: MenuItemState[] = [];

      for (const item of MENU_CONFIG) {
        // Check admin-only items
        if (item.adminOnly && !isAdmin) {
          continue;
        }

        // Check feature access
        let isAccessible = true;
        let isLocked = false;

        if (item.featureId) {
          isAccessible = await isFeatureEnabled(item.featureId);
          // If not accessible but showWhenLocked is true, show as locked
          if (!isAccessible && item.showWhenLocked) {
            isLocked = true;
          } else if (!isAccessible) {
            // Skip items that are not accessible and not showWhenLocked
            continue;
          }
        }

        // Process sub-items if present
        if (item.subItems) {
          const processedSubItems: MenuItem[] = [];

          for (const subItem of item.subItems) {
            // Check admin-only sub-items
            if (subItem.adminOnly && !isAdmin) {
              continue;
            }

            // Check feature access for sub-items
            let subAccessible = true;
            if (subItem.featureId) {
              subAccessible = await isFeatureEnabled(subItem.featureId);
              if (!subAccessible && !subItem.showWhenLocked) {
                continue;
              }
            }

            processedSubItems.push(subItem);
          }

          if (processedSubItems.length > 0 || isLocked) {
            processedItems.push({
              item: { ...item, subItems: processedSubItems },
              isAccessible: isAccessible || isLocked,
              isLocked,
            });
          }
        } else {
          processedItems.push({
            item,
            isAccessible: isAccessible || isLocked,
            isLocked,
          });
        }
      }

      setMenuItems(processedItems);
    };

    processMenuItems();
  }, [isSuperAdmin, isFeatureEnabled, appUser, company, isAdmin]);

  const toggleSubMenu = (href: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  // Handle click on locked feature
  const handleLockedClick = (item: MenuItem, e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLockedModal({
      isOpen: true,
      featureName: item.label,
      featureIcon: item.icon,
      minPlan: item.minPlan || "starter",
      featureId: item.featureId,
    });
  };

  // Keyboard navigation handler for menu items
  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>,
    item: MenuItem,
    isLocked: boolean,
    hasSubItems: boolean
  ) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (isLocked) {
          e.preventDefault();
          handleLockedClick(item, e);
        } else if (hasSubItems) {
          e.preventDefault();
          toggleSubMenu(item.href);
        }
        // For links, let default behavior handle navigation
        break;
      case "ArrowRight":
        if (hasSubItems && !openSubMenus[item.href]) {
          e.preventDefault();
          setOpenSubMenus((prev) => ({ ...prev, [item.href]: true }));
        }
        break;
      case "ArrowLeft":
        if (hasSubItems && openSubMenus[item.href]) {
          e.preventDefault();
          setOpenSubMenus((prev) => ({ ...prev, [item.href]: false }));
        }
        break;
      case "Escape":
        if (hasSubItems && openSubMenus[item.href]) {
          e.preventDefault();
          setOpenSubMenus((prev) => ({ ...prev, [item.href]: false }));
        }
        break;
    }
  };

  // Initialize open state for sub-menus based on current path
  useEffect(() => {
    const initialOpenState: Record<string, boolean> = {};
    menuItems.forEach(({ item }) => {
      if (
        item.subItems &&
        item.subItems.some(
          (sub) =>
            pathname === sub.href ||
            (sub.href !== "/" && pathname.startsWith(sub.href))
        )
      ) {
        initialOpenState[item.href] = true;
      } else {
        initialOpenState[item.href] = openSubMenus[item.href] || false;
      }
    });
    setOpenSubMenus(initialOpenState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, menuItems]);

  // Animate menu items on mount
  useEffect(() => {
    if (menuRef.current && menuItems.length > 0) {
      const items = menuRef.current.querySelectorAll("[data-nav-item]");
      gsap.fromTo(
        items,
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.2, stagger: 0, ease: "power2.out" }
      );
    }
  }, [menuItems]);

  // Render badge component with accessibility
  const renderBadge = (badge: BadgeType | undefined) => {
    if (!badge) return null;
    const style = BADGE_STYLES[badge];
    return (
      <span
        className={cn(
          "px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded",
          style.bg,
          style.text
        )}
        aria-label={`${style.label} feature`}
      >
        {style.label}
      </span>
    );
  };

  // Render lock icon for locked items with accessibility
  const renderLockIcon = () => (
    <Icon
      icon="solar:lock-linear"
      className="w-3.5 h-3.5 text-amber-500 shrink-0"
      aria-hidden="true"
    />
  );

  return (
    <>
      {/* Quick Actions at top */}
      {!isSuperAdmin && <QuickActions />}

      <SidebarMenu 
        ref={menuRef} 
        className="px-2 py-1 space-y-1 flex-1"
        role="navigation"
        aria-label="Main navigation"
      >
        {menuItems.map(({ item, isLocked }, index) => {
          const isParentActive =
            pathname === item.href ||
            (item.href !== "/" &&
              pathname.startsWith(item.href) &&
              !item.subItems?.some((sub) => pathname.startsWith(sub.href)));
          const isSubMenuOpen = openSubMenus[item.href] || false;
          const effectiveBadge = getEffectiveBadge(item);

          // Add section dividers
          const showDividerBefore =
            index > 0 &&
            (item.id === "customers" || // After Digital Card
              item.id === "team"); // Before Team

          if (item.subItems && item.subItems.length > 0) {
            const isAnySubItemActive = item.subItems.some(
              (sub) =>
                pathname === sub.href ||
                (sub.href !== item.href &&
                  pathname.startsWith(sub.href) &&
                  sub.href.length > item.href.length)
            );
            const isActive =
              isAnySubItemActive || (isParentActive && item.href === pathname);

            return (
              <React.Fragment key={item.id}>
                {showDividerBefore && (
                  <div className="my-2 border-t border-border/50" />
                )}
                <SidebarMenuItem data-nav-item className="list-none" role="none">
                  <button
                    onClick={() =>
                      isLocked ? handleLockedClick(item, {} as React.MouseEvent) : toggleSubMenu(item.href)
                    }
                    onKeyDown={(e) => handleKeyDown(e, item, isLocked, true)}
                    aria-expanded={isSubMenuOpen}
                    aria-haspopup={!isLocked}
                    aria-label={isLocked ? `${item.label} - Locked, click to upgrade` : item.label}
                    title={item.tooltip}
                    data-state={isActive ? "on" : "off"}
                    className={cn(
                      "flex items-center gap-x-3 px-2 h-8 w-full border rounded-lg transition-all duration-100 cursor-pointer justify-between",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isLocked && "opacity-60",
                      isActive && !isLocked
                        ? "bg-card text-foreground border-border font-semibold"
                        : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-x-3">
                      <Icon
                        icon={item.icon}
                        className="h-[18px] w-[18px] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-medium text-sm">{item.label}</span>
                      {isLocked ? renderLockIcon() : renderBadge(effectiveBadge)}
                    </div>
                    {!isLocked && (
                      <Icon
                        icon="solar:alt-arrow-down-linear"
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          isSubMenuOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {/* Submenu with animation */}
                  {!isLocked && (
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200 ease-out",
                        isSubMenuOpen
                          ? "max-h-[500px] opacity-100"
                          : "max-h-0 opacity-0"
                      )}
                      role="menu"
                      aria-label={`${item.label} submenu`}
                    >
                      <div className="mt-1 ml-7 space-y-1">
                        {item.subItems.map((subItem) => {
                          const isExactMatch = pathname === subItem.href;
                          const startsWithMatch =
                            subItem.href !== item.href &&
                            pathname.startsWith(subItem.href);
                          const hasBetterMatch = item.subItems?.some(
                            (other) =>
                              other.href !== subItem.href &&
                              other.href.startsWith(subItem.href) &&
                              pathname.startsWith(other.href)
                          );
                          const isSubItemActive =
                            isExactMatch || (startsWithMatch && !hasBetterMatch);
                          const subEffectiveBadge = getEffectiveBadge(subItem);

                          return (
                            <SubMenuItem
                              key={subItem.href}
                              subItem={subItem}
                              isActive={isSubItemActive}
                              effectiveBadge={subEffectiveBadge}
                              onPrefetch={prefetchRoute}
                              onLockedClick={handleLockedClick}
                              isFeatureEnabled={isFeatureEnabled}
                              renderBadge={renderBadge}
                              renderLockIcon={renderLockIcon}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </SidebarMenuItem>
              </React.Fragment>
            );
          } else {
            return (
              <React.Fragment key={item.id}>
                {showDividerBefore && (
                  <div className="my-2 border-t border-border/50" />
                )}
                <SidebarMenuItem
                  data-nav-item
                  className="list-none"
                  role="none"
                  onMouseEnter={() => !isLocked && prefetchRoute(item.href)}
                >
                  {isLocked ? (
                    <button
                      onClick={(e) => handleLockedClick(item, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleLockedClick(item, e);
                        }
                      }}
                      aria-label={`${item.label} - Locked, click to upgrade`}
                      title={item.tooltip}
                      className={cn(
                        "flex items-center gap-x-3 px-2 h-8 w-full border rounded-lg transition-all duration-100",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border opacity-60"
                      )}
                    >
                      <Icon
                        icon={item.icon}
                        className="h-[18px] w-[18px] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-medium text-sm">{item.label}</span>
                      {renderLockIcon()}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      data-state={isParentActive ? "on" : "off"}
                      aria-current={isParentActive ? "page" : undefined}
                      title={item.tooltip}
                      className={cn(
                        "flex items-center gap-x-3 px-2 h-8 w-full border rounded-lg transition-all duration-100",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isParentActive
                          ? "bg-card text-foreground border-border font-semibold"
                          : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border"
                      )}
                    >
                      <Icon
                        icon={item.icon}
                        className="h-[18px] w-[18px] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-medium text-sm">{item.label}</span>
                      {renderBadge(effectiveBadge)}
                    </Link>
                  )}
                </SidebarMenuItem>
              </React.Fragment>
            );
          }
        })}
      </SidebarMenu>

      {/* Upgrade Banner at bottom */}
      <SidebarUpgradeBanner />

      {/* Locked Feature Modal */}
      <LockedFeatureModal
        isOpen={lockedModal.isOpen}
        onClose={() => setLockedModal((prev) => ({ ...prev, isOpen: false }))}
        featureName={lockedModal.featureName}
        featureIcon={lockedModal.featureIcon}
        minPlan={lockedModal.minPlan}
        featureId={lockedModal.featureId}
      />
    </>
  );
}

// Sub-item component with async locked state check and accessibility
function SubMenuItem({
  subItem,
  isActive,
  effectiveBadge,
  onPrefetch,
  onLockedClick,
  isFeatureEnabled,
  renderBadge,
  renderLockIcon,
}: {
  subItem: MenuItem;
  isActive: boolean;
  effectiveBadge: BadgeType | undefined;
  onPrefetch: (href: string) => void;
  onLockedClick: (item: MenuItem, e: React.MouseEvent | React.KeyboardEvent) => void;
  isFeatureEnabled: (featureId: string) => Promise<boolean>;
  renderBadge: (badge: BadgeType | undefined) => React.ReactNode;
  renderLockIcon: () => React.ReactNode;
}) {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const checkLocked = async () => {
      if (subItem.featureId && subItem.showWhenLocked) {
        const accessible = await isFeatureEnabled(subItem.featureId);
        setIsLocked(!accessible);
      }
    };
    checkLocked();
  }, [subItem, isFeatureEnabled]);

  if (isLocked) {
    return (
      <button
        onClick={(e) => onLockedClick(subItem, e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onLockedClick(subItem, e);
          }
        }}
        role="menuitem"
        aria-label={`${subItem.label} - Locked, click to upgrade`}
        title={subItem.tooltip}
        className={cn(
          "flex items-center gap-x-3 px-2 h-7 w-full border rounded-lg transition-all duration-100",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border opacity-60"
        )}
      >
        <Icon icon={subItem.icon} className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="font-medium text-xs">{subItem.label}</span>
        {renderLockIcon()}
      </button>
    );
  }

  return (
    <Link
      href={subItem.href}
      data-state={isActive ? "on" : "off"}
      role="menuitem"
      aria-current={isActive ? "page" : undefined}
      title={subItem.tooltip}
      onMouseEnter={() => onPrefetch(subItem.href)}
      className={cn(
        "flex items-center gap-x-3 px-2 h-7 w-full border rounded-lg transition-all duration-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        isActive
          ? "bg-card text-foreground border-border font-semibold"
          : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border"
      )}
    >
      <Icon icon={subItem.icon} className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="font-medium text-xs">{subItem.label}</span>
      {renderBadge(effectiveBadge)}
    </Link>
  );
}

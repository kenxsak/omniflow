"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import gsap from "gsap";

interface NavItem {
  href: string;
  label: string;
  icon: string; // Solar icon name
  tooltip: string;
  subItems?: NavItem[];
  disabled?: boolean;
  featureId?: string;
  adminOnly?: boolean;
  badge?: string;
}

const allNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "solar:home-2-linear",
    tooltip: "View your business overview and quick stats",
  },

  {
    href: "/digital-card/manage",
    label: "Digital Cards",
    icon: "solar:smartphone-linear",
    tooltip: "Create digital business cards with Voice AI chatbot",
    featureId: "feat_digital_cards",
    badge: "FREE",
    subItems: [
      {
        href: "/digital-card/manage",
        label: "My Cards",
        icon: "solar:clipboard-list-linear",
        tooltip: "View and edit your business cards",
      },
      {
        href: "/digital-card/create",
        label: "Create New",
        icon: "solar:add-circle-linear",
        tooltip: "Make a new digital business card",
      },
    ],
  },

  {
    href: "/crm",
    label: "Contacts",
    icon: "solar:user-circle-linear",
    tooltip: "People interested in your business",
    featureId: "feat_core_crm",
    subItems: [
      {
        href: "/crm",
        label: "All Contacts",
        icon: "solar:users-group-two-rounded-linear",
        tooltip: "View and manage contacts",
      },
      {
        href: "/crm/pipeline",
        label: "Sales Pipeline",
        icon: "solar:widget-5-linear",
        tooltip: "Track deals through stages",
      },
      {
        href: "/appointments",
        label: "Appointments",
        icon: "solar:calendar-mark-linear",
        tooltip: "Schedule appointments",
      },
    ],
  },

  {
    href: "/tasks",
    label: "Tasks",
    icon: "solar:clipboard-check-linear",
    tooltip: "Create and track your to-do items",
    featureId: "feat_core_crm",
  },

  {
    href: "/campaigns",
    label: "Campaigns",
    icon: "solar:paper-plane-linear",
    tooltip: "Send emails, SMS & WhatsApp",
    featureId: "feat_email_marketing",
    subItems: [
      {
        href: "/campaigns",
        label: "Overview",
        icon: "solar:widget-5-linear",
        tooltip: "See all campaigns",
      },
      {
        href: "/campaigns/ai-email",
        label: "AI Email",
        icon: "solar:magic-stick-3-linear",
        tooltip: "Create with AI",
      },
      {
        href: "/campaigns/ai-email/drafts",
        label: "Drafts",
        icon: "solar:document-text-linear",
        tooltip: "Saved drafts",
      },
      {
        href: "/campaigns/ai-email/delivery",
        label: "Delivery",
        icon: "solar:checkmark-circle-linear",
        tooltip: "Track delivery",
      },
      {
        href: "/campaigns/email-lists",
        label: "Email Lists",
        icon: "solar:users-group-two-rounded-linear",
        tooltip: "Manage lists",
      },
      {
        href: "/campaigns/email-automations",
        label: "Automations",
        icon: "solar:robot-linear",
        tooltip: "Auto sequences",
      },
      {
        href: "/campaigns/messages",
        label: "SMS",
        icon: "solar:chat-square-linear",
        tooltip: "SMS campaigns",
        featureId: "feat_sms_whatsapp",
      },
      {
        href: "/campaigns/whatsapp",
        label: "WhatsApp",
        icon: "solar:chat-round-dots-linear",
        tooltip: "WhatsApp campaigns",
        featureId: "feat_sms_whatsapp",
      },
      {
        href: "/campaigns/whatsapp/bulk",
        label: "Bulk Send",
        icon: "solar:paper-plane-linear",
        tooltip: "Bulk WhatsApp",
        featureId: "feat_sms_whatsapp",
      },
      {
        href: "/campaigns/templates",
        label: "Templates",
        icon: "solar:document-text-linear",
        tooltip: "All templates",
      },
    ],
  },

  {
    href: "/ai-chat",
    label: "AI Tools",
    icon: "solar:magic-stick-3-linear",
    tooltip: "AI-powered features",
    featureId: "feat_ai_content_gen",
    subItems: [
      {
        href: "/ai-chat",
        label: "Smart Chat",
        icon: "solar:chat-round-dots-linear",
        tooltip: "AI assistant",
      },
      {
        href: "/social-media",
        label: "Content Writer",
        icon: "solar:pen-new-square-linear",
        tooltip: "Auto-write content",
      },
      {
        href: "/social-media/content-hub",
        label: "Content Hub",
        icon: "solar:clipboard-list-linear",
        tooltip: "Saved content",
      },
      {
        href: "/ai-campaign-manager",
        label: "Ad Copy",
        icon: "solar:chart-2-linear",
        tooltip: "Generate ad copy",
        featureId: "feat_ai_ads_manager",
      },
      {
        href: "/ai-usage",
        label: "AI Credits",
        icon: "solar:wallet-money-linear",
        tooltip: "Track usage",
      },
    ],
  },

  {
    href: "/advanced-analytics",
    label: "Reports",
    icon: "solar:graph-up-linear",
    tooltip: "Business performance",
    featureId: "feat_advanced_analytics",
  },

  {
    href: "/team-management",
    label: "Team",
    icon: "solar:users-group-two-rounded-linear",
    tooltip: "Manage team members",
    featureId: "feat_core_crm",
  },

  {
    href: "/settings",
    label: "Settings",
    icon: "solar:settings-linear",
    tooltip: "Account settings",
    subItems: [
      {
        href: "/settings",
        label: "Account & Plan",
        icon: "solar:card-linear",
        tooltip: "Subscription",
      },
      {
        href: "/crm/integrations",
        label: "Integrations",
        icon: "solar:link-minimalistic-2-linear",
        tooltip: "Connect tools",
      },
      {
        href: "/settings/enterprise",
        label: "Enterprise",
        icon: "solar:shield-check-linear",
        tooltip: "Team settings",
        adminOnly: true,
        featureId: "feat_enterprise_team",
      },
    ],
  },
];

const superAdminNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "solar:home-2-linear",
    tooltip: "System overview",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: "solar:card-linear",
    tooltip: "All payments",
  },
  {
    href: "/super-admin-ai-costs",
    label: "AI Costs",
    icon: "solar:wallet-money-linear",
    tooltip: "AI profitability",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: "solar:settings-linear",
    tooltip: "System settings",
  },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const { isSuperAdmin, appUser, company } = useAuth();
  const { isFeatureEnabled } = useFeatureFlag();
  const [filteredNavItems, setFilteredNavItems] = useState<NavItem[]>([]);
  const menuRef = useRef<HTMLUListElement>(null);

  const isAdmin = appUser?.role === "admin" || appUser?.role === "superadmin";

  // Prefetch routes on hover for instant navigation
  const prefetchRoute = useCallback((href: string) => {
    if (href && href !== '#' && !href.startsWith('http')) {
      router.prefetch(href);
    }
  }, [router]);

  // Prefetch all main routes on mount for instant navigation
  useEffect(() => {
    const prefetchMainRoutes = () => {
      const mainRoutes = ['/dashboard', '/crm', '/tasks', '/campaigns', '/ai-chat', '/settings'];
      mainRoutes.forEach(route => {
        router.prefetch(route);
      });
    };
    // Delay prefetching to not block initial render
    const timer = setTimeout(prefetchMainRoutes, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const filterItems = async () => {
      if (isSuperAdmin) {
        setFilteredNavItems(superAdminNavItems);
        return;
      }
      const enabledItems: NavItem[] = [];
      for (const item of allNavItems) {
        const parentFeatureEnabled =
          !item.featureId || (await isFeatureEnabled(item.featureId));

        if (parentFeatureEnabled) {
          if (item.subItems) {
            const filteredSubItems: NavItem[] = [];
            for (const subItem of item.subItems) {
              const passesAdminCheck = !subItem.adminOnly || isAdmin;
              const passesFeatureCheck =
                !subItem.featureId ||
                (await isFeatureEnabled(subItem.featureId));
              if (passesAdminCheck && passesFeatureCheck) {
                filteredSubItems.push(subItem);
              }
            }
            if (filteredSubItems.length > 0) {
              enabledItems.push({ ...item, subItems: filteredSubItems });
            }
          } else {
            enabledItems.push(item);
          }
        }
      }
      setFilteredNavItems(enabledItems);
    };
    filterItems();
  }, [isSuperAdmin, isFeatureEnabled, appUser, company, isAdmin]);

  const toggleSubMenu = (href: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  useEffect(() => {
    const initialOpenState: Record<string, boolean> = {};
    filteredNavItems.forEach((item) => {
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
  }, [pathname, filteredNavItems]);

  // Animate menu items on mount - instant
  useEffect(() => {
    if (menuRef.current && filteredNavItems.length > 0) {
      const items = menuRef.current.querySelectorAll("[data-nav-item]");
      gsap.fromTo(
        items,
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.2, stagger: 0, ease: "power2.out" }
      );
    }
  }, [filteredNavItems]);

  return (
    <SidebarMenu ref={menuRef} className="px-2 py-1 space-y-1">
      {filteredNavItems.map((item) => {
        const isParentActive =
          pathname === item.href ||
          (item.href !== "/" &&
            pathname.startsWith(item.href) &&
            !item.subItems?.some((sub) => pathname.startsWith(sub.href)));
        const isSubMenuOpen = openSubMenus[item.href] || false;

        if (item.subItems) {
          const isAnySubItemActive = item.subItems.some(
            (sub) =>
              pathname === sub.href ||
              (sub.href !== item.href &&
                pathname.startsWith(sub.href) &&
                sub.href.length > item.href.length)
          );
          const isActive = isAnySubItemActive || (isParentActive && item.href === pathname);
          
          return (
            <SidebarMenuItem key={item.label} data-nav-item className="list-none">
              {/* AutoSend-style button with expandable submenu */}
              <button
                onClick={() => toggleSubMenu(item.href)}
                aria-expanded={isSubMenuOpen}
                data-state={isActive ? "on" : "off"}
                className={cn(
                  "flex items-center gap-x-3 px-2 h-8 w-full border rounded-lg transition-all duration-100 cursor-pointer justify-between",
                  isActive 
                    ? "bg-card text-foreground border-border font-semibold" 
                    : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border"
                )}
              >
                <div className="flex items-center gap-x-3">
                  <Icon icon={item.icon} className="h-[18px] w-[18px] shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isSubMenuOpen && "rotate-180"
                  )}
                />
              </button>
              
              {/* Submenu with animation */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out",
                  isSubMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="mt-1 ml-7 space-y-1">
                  {item.subItems.map((subItem) => {
                    const isSubItemActive =
                      pathname === subItem.href ||
                      (subItem.href !== item.href &&
                        pathname.startsWith(subItem.href) &&
                        subItem.href.length > item.href.length);
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        data-state={isSubItemActive ? "on" : "off"}
                        onMouseEnter={() => prefetchRoute(subItem.href)}
                        className={cn(
                          "flex items-center gap-x-3 px-2 h-7 w-full border rounded-lg transition-all duration-100",
                          isSubItemActive 
                            ? "bg-card text-foreground border-border font-semibold" 
                            : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border"
                        )}
                      >
                        <Icon icon={subItem.icon} className="h-4 w-4 shrink-0" />
                        <span className="font-medium text-xs">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </SidebarMenuItem>
          );
        } else {
          return (
            <SidebarMenuItem key={item.label} data-nav-item className="list-none" onMouseEnter={() => !item.disabled && prefetchRoute(item.href)}>
              <Link
                href={item.disabled ? "#" : item.href}
                data-state={isParentActive && !item.disabled ? "on" : "off"}
                className={cn(
                  "flex items-center gap-x-3 px-2 h-8 w-full border rounded-lg transition-all duration-100",
                  isParentActive && !item.disabled 
                    ? "bg-card text-foreground border-border font-semibold" 
                    : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border",
                  item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent hover:text-muted-foreground"
                )}
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
              >
                <Icon icon={item.icon} className="h-[18px] w-[18px] shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            </SidebarMenuItem>
          );
        }
      })}
    </SidebarMenu>
  );
}

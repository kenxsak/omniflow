"use client";

import { PricingTable } from "@/components/settings/pricing-table";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BillingPage() {
    const pathname = usePathname();

    const tabs = [
        { label: "General", href: "/settings" },
        { label: "Usage & Billing", href: "/settings/usage" }, // Keeping existing convention if any
        { label: "Change Plan", href: "/settings/billing", active: true },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Navigation Tabs (Simulating the user's design which had navigation embedded) */}
            <div className="flex flex-col gap-4">
                {/* Note: In a real app this might be a shared layout component, but implementing here to match design specifically */}
                <div className="flex items-center overflow-x-auto border-b border-stone-200 dark:border-stone-800">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                tab.active
                                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                    : "border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-900/50"
                            )}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>

            <PricingTable />
        </div>
    );
}

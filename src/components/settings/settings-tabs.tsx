"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsTabs() {
    const pathname = usePathname();

    const tabs = [
        { label: "General", href: "/settings", exact: true },
        { label: "Usage & Billing", href: "/settings/usage" },
        { label: "Change Plan", href: "/settings/subscription" },
    ];

    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
                <p className="text-stone-800 dark:text-stone-100 font-semibold text-lg">Account</p>
            </div>
            <div className="mr-px px-0 flex">
                <div className="flex items-center border-b border-stone-200 dark:border-stone-800 w-full bg-stone-50 dark:bg-stone-900/50 rounded-t-lg">
                    <ul className="flex items-center text-sm gap-1 overflow-x-auto p-1" style={{ zIndex: 5 }}>
                        {tabs.map((tab) => {
                            const isActive = tab.exact
                                ? pathname === tab.href
                                : pathname.startsWith(tab.href);

                            return (
                                <li key={tab.href} className="flex items-center">
                                    <Link
                                        href={tab.href}
                                        className={cn(
                                            "flex whitespace-nowrap text-center border-b-2 items-center justify-between text-sm transition-all ease-in duration-75 font-medium border-transparent",
                                            isActive
                                                ? "text-indigo-600 dark:text-brand-600 border-indigo-400"
                                                : "text-stone-950 dark:text-stone-300 hover:text-stone-700 dark:hover:text-stone-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "rounded-[10px] px-3 py-1 mb-1 transition-colors",
                                            isActive ? "" : "hover:bg-stone-200 dark:hover:bg-stone-800"
                                        )}>
                                            {tab.label}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
}

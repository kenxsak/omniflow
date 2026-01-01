"use client";

import { X, PlayCircle, Mail, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { helpContent, type PageId } from "@/lib/help-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

interface HelpPanelProps {
  pageId: PageId;
  isOpen: boolean;
  onClose: () => void;
}

export function HelpPanel({ pageId, isOpen, onClose }: HelpPanelProps) {
  const content = helpContent[pageId];

  if (!content) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 sm:bottom-24 sm:right-6",
        "w-[calc(100vw-32px)] sm:w-96 max-w-md",
        "max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-140px)]",
        "transition-all duration-300 transform",
        isOpen
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      )}
      style={{ zIndex: 99998 }}
    >
      <div className="rounded-2xl shadow-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex flex-col max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-140px)] overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-violet-500 dark:to-purple-600 px-5 py-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="text-xl sm:text-2xl">💡</span>
                Need Help?
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-white/80">
                Here&apos;s what you can do on this page
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 -mr-2 -mt-1 text-white/80 hover:text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-5 py-4 space-y-5">
            {/* Overview */}
            {content.overview && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-3 rounded-xl">
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  {content.overview}
                </p>
              </div>
            )}

            {/* What can I do here? */}
            <div>
              <h3 className="font-semibold text-sm mb-2.5 text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">✨</span>
                What can I do here?
              </h3>
              <ul className="space-y-2">
                {content.capabilities.map((capability, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-xs sm:text-sm"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-500 dark:bg-indigo-600 text-white flex items-center justify-center text-[10px] font-medium mt-0.5 shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-stone-700 dark:text-stone-300">{capability}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Actions */}
            {content.quickActions && content.quickActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2.5 text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-xs">⚡</span>
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {content.quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={action.onClick}
                      className="text-xs h-8 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                    >
                      {action.icon && (
                        <action.icon className="mr-1.5 h-3 w-3" />
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Video Tutorial */}
            {content.videoUrl && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-3 rounded-xl">
                <h3 className="font-semibold text-sm mb-2 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <PlayCircle className="h-4 w-4" />
                  Watch Tutorial
                </h3>
                <a
                  href={content.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1.5"
                >
                  📺 {content.videoTitle || "Watch how to use this page"} ({content.videoDuration || "0:30"})
                </a>
              </div>
            )}

            {/* Tips */}
            {content.tips && content.tips.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2.5 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-xs">💡</span>
                  Pro Tips
                </h3>
                <ul className="space-y-2">
                  {content.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-xs sm:text-sm"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-600 text-white flex items-center justify-center text-[10px] mt-0.5 shrink-0">✓</span>
                      <span className="text-stone-600 dark:text-stone-400">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* FAQs */}
            {content.faqs && content.faqs.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xs">❓</span>
                  Common Questions
                </h3>
                <div className="space-y-3">
                  {content.faqs.map((faq, index) => (
                    <div key={index} className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">
                        {faq.question}
                      </p>
                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Need More Help? */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
              <h3 className="font-semibold text-sm mb-2.5 text-stone-700 dark:text-stone-300">
                Still need help?
              </h3>
              <Button
                asChild
                size="sm"
                className="w-full text-xs sm:text-sm h-10 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-violet-500 dark:to-purple-600 hover:from-blue-600 hover:to-indigo-700 dark:hover:from-violet-600 dark:hover:to-purple-700 text-white"
              >
                <Link href="/help-center">
                  <Headphones className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

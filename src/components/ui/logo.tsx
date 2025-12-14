"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  textClassName?: string;
}

const sizes = {
  sm: { logo: 24, text: "text-base" },
  md: { logo: 32, text: "text-lg sm:text-xl" },
  lg: { logo: 40, text: "text-xl sm:text-2xl" },
};

export function Logo({
  href,
  showText = true,
  size = "md",
  className,
  textClassName,
}: LogoProps) {
  const { logo: logoSize, text: textSize } = sizes[size];

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Light theme logo */}
      <Image
        src="/favicon-light/android-chrome-192x192.png"
        alt="OmniFlow"
        width={logoSize}
        height={logoSize}
        className="object-contain dark:hidden"
        priority
      />
      {/* Dark theme logo */}
      <Image
        src="/favicon-dark/android-chrome-192x192.png"
        alt="OmniFlow"
        width={logoSize}
        height={logoSize}
        className="object-contain hidden dark:block"
        priority
      />
      {showText && (
        <span className={cn("font-bold text-foreground", textSize, textClassName)}>
          OmniFlow
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center" aria-label="OmniFlow Home">
        {content}
      </Link>
    );
  }

  return content;
}

// Icon-only version for compact spaces
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <>
      {/* Light theme icon */}
      <Image
        src="/favicon-light/android-chrome-192x192.png"
        alt="OmniFlow"
        width={size}
        height={size}
        className={cn("object-contain dark:hidden", className)}
        priority
      />
      {/* Dark theme icon */}
      <Image
        src="/favicon-dark/android-chrome-192x192.png"
        alt="OmniFlow"
        width={size}
        height={size}
        className={cn("object-contain hidden dark:block", className)}
        priority
      />
    </>
  );
}

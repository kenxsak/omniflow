"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useWhiteLabel } from "@/hooks/use-white-label";

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
  
  // Try to use white-label settings if available
  let isWhiteLabeled = false;
  let brandName = "OmniFlow";
  let logoUrl: string | null = null;
  let logoDarkUrl: string | null = null;
  
  try {
    const whiteLabel = useWhiteLabel();
    isWhiteLabeled = whiteLabel.isWhiteLabeled;
    brandName = whiteLabel.brandName;
    logoUrl = whiteLabel.logoUrl;
    logoDarkUrl = whiteLabel.logoDarkUrl;
  } catch {
    // WhiteLabelProvider not available (e.g., on public pages)
  }

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {isWhiteLabeled && (logoUrl || logoDarkUrl) ? (
        <>
          {/* White-label light theme logo */}
          {logoUrl && (
            <img
              src={logoUrl}
              alt={brandName}
              style={{ width: logoSize, height: logoSize }}
              className="object-contain dark:hidden"
            />
          )}
          {/* White-label dark theme logo */}
          {(logoDarkUrl || logoUrl) && (
            <img
              src={logoDarkUrl || logoUrl || ''}
              alt={brandName}
              style={{ width: logoSize, height: logoSize }}
              className="object-contain hidden dark:block"
            />
          )}
        </>
      ) : (
        <>
          {/* Default light theme logo */}
          <Image
            src="/favicon-light/android-chrome-192x192.png"
            alt={brandName}
            width={logoSize}
            height={logoSize}
            className="object-contain dark:hidden"
            priority
          />
          {/* Default dark theme logo */}
          <Image
            src="/favicon-dark/android-chrome-192x192.png"
            alt={brandName}
            width={logoSize}
            height={logoSize}
            className="object-contain hidden dark:block"
            priority
          />
        </>
      )}
      {showText && (
        <span className={cn("font-bold text-foreground", textSize, textClassName)}>
          {brandName}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center" aria-label={`${brandName} Home`}>
        {content}
      </Link>
    );
  }

  return content;
}

// Icon-only version for compact spaces
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  // Try to use white-label settings if available
  let isWhiteLabeled = false;
  let brandName = "OmniFlow";
  let logoUrl: string | null = null;
  let logoDarkUrl: string | null = null;
  
  try {
    const whiteLabel = useWhiteLabel();
    isWhiteLabeled = whiteLabel.isWhiteLabeled;
    brandName = whiteLabel.brandName;
    logoUrl = whiteLabel.logoUrl;
    logoDarkUrl = whiteLabel.logoDarkUrl;
  } catch {
    // WhiteLabelProvider not available
  }

  if (isWhiteLabeled && (logoUrl || logoDarkUrl)) {
    return (
      <>
        {logoUrl && (
          <img
            src={logoUrl}
            alt={brandName}
            style={{ width: size, height: size }}
            className={cn("object-contain dark:hidden", className)}
          />
        )}
        {(logoDarkUrl || logoUrl) && (
          <img
            src={logoDarkUrl || logoUrl || ''}
            alt={brandName}
            style={{ width: size, height: size }}
            className={cn("object-contain hidden dark:block", className)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Light theme icon */}
      <Image
        src="/favicon-light/android-chrome-192x192.png"
        alt={brandName}
        width={size}
        height={size}
        className={cn("object-contain dark:hidden", className)}
        priority
      />
      {/* Dark theme icon */}
      <Image
        src="/favicon-dark/android-chrome-192x192.png"
        alt={brandName}
        width={size}
        height={size}
        className={cn("object-contain hidden dark:block", className)}
        priority
      />
    </>
  );
}

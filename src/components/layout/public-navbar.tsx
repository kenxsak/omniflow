"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";

export function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-b border-border/10 dark:border-border/5">
      <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <Logo href="/" size="md" />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-4 xl:gap-6 items-center">
          <Link
            href="/#digital-card"
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
          >
            <Icon icon="solar:smartphone-bold" className="w-4 h-4" />
            <span>Digital Card</span>
            <Badge className="bg-success text-success-foreground text-xs font-semibold">FREE</Badge>
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#ecommerce-integrations"
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
          >
            <span>Integrations</span>
            <Badge className="bg-muted text-foreground text-xs font-medium">10+</Badge>
          </Link>
          <Link
            href="/#comparison"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Compare
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign In
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="touch-target"
          >
            {isMenuOpen ? (
              <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
            ) : (
              <Icon icon="solar:hamburger-menu-linear" className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 border-t border-border/10 dark:border-border/5 bg-background/80 backdrop-blur-xl",
          isMenuOpen ? "max-h-[400px]" : "max-h-0 border-t-0"
        )}
      >
        <div className="container mx-auto px-4 py-4 space-y-3">
          <Link
            href="/#digital-card"
            className="flex items-center gap-2 text-base font-medium hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            <Icon icon="solar:smartphone-bold" className="w-4 h-4" />
            <span>Digital Card</span>
            <Badge className="bg-success text-success-foreground text-xs font-semibold">FREE</Badge>
          </Link>
          <Link
            href="/#features"
            className="block text-base font-medium hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/#ecommerce-integrations"
            className="flex items-center gap-2 text-base font-medium hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            <span>Integrations</span>
            <Badge className="bg-muted text-foreground text-xs font-medium">10+</Badge>
          </Link>
          <Link
            href="/#comparison"
            className="block text-base font-medium hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Compare
          </Link>
          <Link
            href="/#pricing"
            className="block text-base font-medium hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="block text-base font-medium hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Sign In
          </Link>
          <div className="flex items-center justify-between py-2">
            <span className="text-base font-medium">Theme</span>
            <ThemeToggle />
          </div>
          <Button asChild className="w-full">
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

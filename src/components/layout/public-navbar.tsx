"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg sm:text-xl text-primary"
        >
          <Icon icon="solar:robot-linear" className="h-6 w-6 sm:h-7 sm:w-7" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            OmniFlow
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-4 xl:gap-6 items-center">
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
            <Badge className="bg-blue-600 text-white text-xs">10+</Badge>
          </Link>
          <Link
            href="/#benefits"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Benefits
          </Link>
          <Link
            href="/#comparison"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Compare
          </Link>
          <Link
            href="/pricing"
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
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
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
          "lg:hidden overflow-hidden transition-all duration-300 border-t",
          isMenuOpen ? "max-h-[400px]" : "max-h-0 border-t-0"
        )}
      >
        <div className="container mx-auto px-4 py-4 space-y-3">
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
            <Badge className="bg-blue-600 text-white text-xs">10+</Badge>
          </Link>
          <Link
            href="/#benefits"
            className="block text-base font-medium hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Benefits
          </Link>
          <Link
            href="/#comparison"
            className="block text-base font-medium hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Compare
          </Link>
          <Link
            href="/pricing"
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
          <Button
            asChild
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

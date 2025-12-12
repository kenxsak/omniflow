"use client";

import { Bot } from 'lucide-react';
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-primary">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>OmniFlow</span>
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} OmniFlow. All rights reserved.
          </p>
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link href="/#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

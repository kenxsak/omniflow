"use client";

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export function PublicFooter() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Logo href="/" size="sm" />
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} All rights reserved.
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

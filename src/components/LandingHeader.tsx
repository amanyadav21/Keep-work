
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Rocket, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
];

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2 group">
          <Rocket className="h-6 w-6 text-primary group-hover:text-primary/90 transition-colors" />
          <span className="font-bold text-lg text-foreground group-hover:text-foreground/90 transition-colors">Upnext</span>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
          
          <ThemeToggle />

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6">
                <div className="mb-6 flex items-center justify-between">
                   <Link href="/" className="flex items-center space-x-2 group" onClick={() => setIsMobileMenuOpen(false)}>
                    <Rocket className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg text-foreground">Upnext</span>
                  </Link>
                  <SheetClose asChild>
                     <Button variant="ghost" size="icon" aria-label="Close menu">
                        <X className="h-5 w-5" />
                      </Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col space-y-4">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.label}>
                      <Link
                        href={item.href}
                        className="text-md text-muted-foreground hover:text-primary py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-8 pt-6 border-t border-border/40 flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/login">Log In</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

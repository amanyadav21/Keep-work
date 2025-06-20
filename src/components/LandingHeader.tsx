
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
];

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full py-3", // Outer container for positioning and vertical padding
    )}>
      <div className={cn(
        "flex h-14 items-center justify-between px-4 sm:px-6",
        "max-w-6xl mx-auto", // Max width and center the actual bar
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80", // Background for the bar
        "rounded-xl shadow-lg", // Rounded corners and shadow for the bar
        "border border-border/40" // Subtle border for the bar
      )}>
        <Link href="/" className="flex items-center group">
          <span className="font-bold text-2xl text-foreground group-hover:text-foreground/90 transition-colors">Upnext</span>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-muted-foreground transition-all duration-150 hover:text-primary px-3 py-1.5 rounded-md hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-foreground hover:bg-accent/10 rounded-full px-4">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-5">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
          
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
                <SheetHeader className="flex flex-row items-center justify-between p-6 border-b">
                  <SheetTitle asChild>
                    <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                      <span className="font-bold text-xl text-foreground">Upnext</span>
                    </Link>
                  </SheetTitle>
                  {/* SheetClose is automatically added by SheetContent */}
                </SheetHeader>

                <ScrollArea className="flex-grow">
                  <div className="p-6">
                    <nav className="flex flex-col space-y-1">
                      {navItems.map((item) => (
                        <SheetClose asChild key={item.label}>
                          <Link
                            href={item.href}
                            className="text-lg text-foreground hover:text-primary py-2.5 px-3 rounded-md hover:bg-muted transition-colors duration-150"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                  </div>
                </ScrollArea>
                
                <div className="p-6 mt-auto border-t border-border/40">
                  <div className="flex flex-col space-y-3">
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

    
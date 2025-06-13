
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LandingHeader } from '@/components/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PricingSection from '@/components/landing/PricingSection';
import CtaSection from '@/components/landing/CtaSection';
import FooterSection from '@/components/landing/FooterSection';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LandingPage() {
  const [showStickyButton, setShowStickyButton] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        // Show button if the bottom of the hero section is above the viewport top
        setShowStickyButton(heroBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check in case the page loads scrolled past the hero
    handleScroll(); 

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <LandingHeader />
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <HeroSection ref={heroRef} /> {/* Pass ref to HeroSection */}
        <FeaturesSection />
        <PricingSection />
        <CtaSection />
        <FooterSection />
      </div>

      {/* Sticky "Get Started" Button */}
      <div
        className={cn(
          "fixed bottom-5 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ease-in-out",
          showStickyButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        )}
      >
        <Button
          asChild
          size="lg" 
          className="rounded-full shadow-lg flex items-center gap-2 text-sm md:text-base" // Using theme's primary color by default
        >
          <Link href="/signup">
            Get Started. It's FREE
            <ArrowRight className="ml-1.5 h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </Button>
      </div>
    </>
  );
}

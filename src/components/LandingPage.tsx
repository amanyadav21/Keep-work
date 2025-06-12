
"use client";

import { LandingHeader } from '@/components/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
// import TestimonialsSection from '@/components/landing/TestimonialsSection'; // Removed
import PricingSection from '@/components/landing/PricingSection';
import CtaSection from '@/components/landing/CtaSection';
import FooterSection from '@/components/landing/FooterSection';

export function LandingPage() {
  return (
    <>
      <LandingHeader />
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <HeroSection />
        <FeaturesSection />
        {/* <TestimonialsSection /> */} {/* Removed */}
        <PricingSection />
        <CtaSection />
        <FooterSection />
      </div>
    </>
  );
}

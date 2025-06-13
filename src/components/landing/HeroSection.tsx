
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react'; // Import React

const HeroSection = React.forwardRef<HTMLElement>((props, ref) => {
  return (
    <section ref={ref} className="relative py-24 md:py-36 lg:py-48 px-4 text-center overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Blurred radial gradients for an "aurora" effect */}
        <div
          className="absolute -top-1/3 -left-1/4 w-3/4 h-3/4 md:w-1/2 md:h-1/2 transform rotate-12 bg-primary/10 dark:bg-primary/5 rounded-full filter blur-3xl opacity-70 dark:opacity-50"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-1/3 -right-1/4 w-4/5 h-4/5 md:w-3/5 md:h-3/5 transform -rotate-12 bg-accent/10 dark:bg-accent/5 rounded-full filter blur-3xl opacity-60 dark:opacity-40"
          aria-hidden="true"
        />
        
        {/* Subtle overall gradient wash to ensure smooth transitions and readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/10 via-transparent to-background/20 opacity-75"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Badge 
          variant="outline" 
          className="mb-8 px-4 py-2 text-sm font-medium text-primary border-primary/50 shadow-lg group hover:shadow-xl transition-shadow hover:bg-primary/10 cursor-default bg-background hover:border-primary/70"
          asChild={false} 
        >
          <Link href="#features" className="inline-flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary/80 group-hover:text-primary transition-colors" />
            Plan. Track. Achieve. Effortlessly.
            <ArrowRight className="h-4 w-4 text-primary/80 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 !leading-tight text-foreground">
          Elevate Your Productivity with <span className="text-primary">Upnext</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Upnext is your intelligent task management hub, meticulously designed for students. Streamline your workflow, conquer deadlines, and unlock your full academic potential.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base py-3.5 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 group">
            <Link href="/signup">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base py-3.5 px-8 bg-card hover:bg-muted border-border hover:border-primary/70 transition-all group text-foreground">
            <Link href="/login">
              I already have an account
              <ArrowRight className="ml-2 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection"; // Setting displayName for the forwarded ref component

export default HeroSection;



"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 lg:py-40 px-4 text-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-3/4 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-75"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-background via-transparent to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Badge 
          variant="outline" 
          className="mb-6 px-4 py-2 text-sm font-medium text-primary border-primary/50 shadow-md group hover:shadow-lg transition-shadow hover:bg-primary/10 cursor-default bg-background"
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
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Upnext is your intelligent task management hub, meticulously designed for students. Streamline your workflow, conquer deadlines, and unlock your full academic potential.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base py-3.5 px-8 shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5 group">
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
}


"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Extracted background image style
const backgroundPatternStyle = `
  linear-gradient(45deg, currentColor 25%, transparent 25%), 
  linear-gradient(-45deg, currentColor 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, currentColor 75%),
  linear-gradient(-45deg, transparent 75%, currentColor 75%)`;

export default function CtaSection() {
  return (
    <section className="relative py-16 md:py-24 bg-primary text-primary-foreground overflow-hidden">
      <div
        className="absolute inset-0 -z-0 opacity-[0.03] bg-gradient-to-tr from-transparent via-white to-transparent"
        style={{
          backgroundImage: backgroundPatternStyle, // Use the extracted constant
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      ></div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Boost Your Productivity?
        </h2>
        <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Join thousands of students who are acing their studies with Upnext. Sign up today and experience the difference.
        </p>
        <Button asChild size="lg" className="bg-background text-primary hover:bg-muted text-base py-3.5 px-8 shadow-lg hover:shadow-slate-500/20 transition-all duration-300 transform hover:-translate-y-0.5 group">
          <Link href="/signup">
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

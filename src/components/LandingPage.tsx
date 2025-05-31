
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
// Removed import { Badge } from '@/components/ui/badge'; as it's no longer used directly here
import { CheckCircle2, CalendarDays, Lightbulb, Globe, ArrowRight, Rocket } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LandingHeader } from '@/components/LandingHeader'; // Import the new LandingHeader

// Feature Card Sub-component
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  iconBgColor,
  iconColor = "text-white",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  iconBgColor: string;
  iconColor?: string;
}) => (
  <div className="bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-start text-left h-full">
    <div className={cn("p-3 rounded-full mb-5 w-fit", iconBgColor)}>
      <Icon className={cn("h-7 w-7", iconColor)} />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
    <p className="text-muted-foreground text-sm flex-grow">{description}</p>
  </div>
);

export function LandingPage() {
  return (
    <>
      <LandingHeader /> {/* Use the new LandingHeader here */}
      <div className="flex flex-col min-h-screen bg-slate-50"> {/* Updated background */}
        {/* Hero Section */}
        <section className="flex-grow flex items-center justify-center py-20 md:py-28 lg:py-32 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/#features" className="inline-flex items-center justify-center gap-2 mb-6 px-4 py-1.5 bg-background text-sm font-medium text-primary rounded-full border border-primary/30 shadow-md hover:bg-primary/5 transition-colors group">
              <Globe className="h-4 w-4 text-primary/80 group-hover:text-primary transition-colors" />
              Plan. Track. Achieve. Effortlessly.
              <ArrowRight className="h-4 w-4 text-primary/80 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </Link>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-8 !leading-tight">
              Elevate Your Productivity with <span className="text-primary">Upnext</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Upnext is your intelligent task management hub, meticulously designed for students. Streamline your workflow, conquer deadlines, and unlock your full academic potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base py-3.5 px-8 shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-0.5 group">
                <Link href="/signup">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base py-3.5 px-8 bg-background/70 hover:bg-background border-border hover:border-primary/70 transition-all group">
                <Link href="/login">
                  I Already Have an Account
                  <ArrowRight className="ml-2 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section "Why Choose Upnext?" */}
        <section id="features" className="py-16 md:py-24 bg-background border-y">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose <span className="text-primary">Upnext</span>?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Streamline your academic life with tools designed for focus and efficiency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={CheckCircle2}
                title="Effortless Task Management"
                description="Create, categorize, and prioritize tasks with due dates and sub-checklists. Turn chaos into clarity."
                iconBgColor="bg-blue-500"
              />
              <FeatureCard
                icon={CalendarDays}
                title="Deadline Mastery"
                description="Never miss a deadline again. Visualize your schedule, plan ahead, and stay on top of your assignments."
                iconBgColor="bg-purple-500"
              />
              <FeatureCard
                icon={Lightbulb}
                title="Smart Insights"
                description="Leverage AI-powered suggestions for task breakdown and contextual help to study smarter, not harder."
                iconBgColor="bg-pink-500"
              />
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 md:py-16 bg-slate-900 text-slate-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
                <Link href="/" className="flex items-center space-x-2 mb-3 group">
                  <Rocket className="h-7 w-7 text-primary" />
                  <span className="font-bold text-xl text-white">Upnext</span>
                </Link>
                <p className="text-sm text-slate-400">Empowering students to achieve more.</p>
              </div>

              <nav className="md:col-span-8 flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm">
                <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
                <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
                <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              </nav>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-700 text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Upnext. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

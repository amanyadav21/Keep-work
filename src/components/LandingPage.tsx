
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Zap, Users, Edit3, TrendingUp, LayoutGrid } from 'lucide-react';
import Image from 'next/image';

const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center gap-3 pb-3">
      <div className="p-2 bg-primary/10 rounded-md">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <CardTitle className="text-xl font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>
    </CardContent>
  </Card>
);

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center py-16 md:py-24 lg:py-32 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, hsl(var(--primary)/0.1) 2px, transparent 2px)', backgroundSize: '20px 20px'}}></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/30 shadow-sm">
            Plan. Track. Complete.
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Elevate Your Productivity with <span className="text-primary">Upnext</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Upnext is your smart companion for managing tasks efficiently. Designed for students, it helps you stay organized, track progress, and achieve your academic goals seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base py-3 px-8 shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base py-3 px-8">
              <Link href="/login">I Already Have an Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background/70 backdrop-blur-md border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Explore the powerful features that make Upnext the ideal task manager for students.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={Edit3}
              title="Effortless Task Creation"
              description="Quickly add, categorize, and prioritize tasks with due dates and subtasks. Stay on top of your assignments, classes, and personal goals."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Visual Progress Tracking"
              description="Monitor your task completion and subtask progress with intuitive visuals. Understand your productivity at a glance."
            />
            <FeatureCard
              icon={Users}
              title="Collaboration Ready (Coming Soon)"
              description="Share projects, delegate tasks, and work together with classmates. (Feature under development)"
            />
            <FeatureCard
              icon={Zap}
              title="AI-Powered Assistance"
              description="Leverage AI to get help with task descriptions, break down complex tasks, or ask study-related questions directly within the app."
            />
            <FeatureCard
              icon={LayoutGrid}
              title="Clean & Intuitive Interface"
              description="Enjoy a clutter-free, user-friendly design that makes task management a breeze on any device."
            />
            <FeatureCard
              icon={CheckCircle}
              title="Stay Organized"
              description="Filter tasks by status (All, Pending, Completed) and manage deleted items in a dedicated trash section."
            />
          </div>
        </div>
      </section>

      {/* Footer (Simple) */}
      <footer className="py-8 text-center border-t border-border/50 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Upnext. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

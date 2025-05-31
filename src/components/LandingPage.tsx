
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Zap, Users, Edit3, TrendingUp, LayoutGrid, ListChecks, Brain, LayoutPanelLeft, Filter, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';

// Individual Bento Card Item (replaces the old FeatureCard)
const BentoGridItem = ({
  icon: Icon,
  title,
  description,
  className = "",
  iconClassName = "text-primary",
  children,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      "bg-card/70 backdrop-blur-md p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex flex-col group",
      className
    )}
  >
    {Icon && (
      <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
        <Icon className={cn("h-8 w-8", iconClassName)} />
      </div>
    )}
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    {description && <p className="text-muted-foreground text-sm flex-grow">{description}</p>}
    {children}
  </div>
);

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center py-20 md:py-28 lg:py-36 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, hsl(var(--primary)/0.05) 1px, transparent 1px)', backgroundSize: '25px 25px'}}></div>
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-5 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/30 shadow-md">
            ✨ Plan. Track. Achieve. ✨
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-8 leading-tight">
            Elevate Your Productivity with <span className="text-primary">Upnext</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Upnext is your intelligent task management hub, meticulously designed for students. Streamline your workflow, conquer deadlines, and unlock your full academic potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base py-3.5 px-10 shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base py-3.5 px-10 bg-background/50 hover:bg-background/80 border-border hover:border-primary/70 transition-all">
              <Link href="/login">I Already Have an Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Bento Features Section */}
      <section className="py-16 md:py-24 border-t border-border/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why <span className="text-primary">Upnext</span> is Your Ultimate Task Companion
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the powerful, intuitive features crafted to help you excel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 auto-rows-auto">
            <BentoGridItem
              className="lg:col-span-4 md:col-span-2 lg:row-span-2 min-h-[300px] "
              icon={ListChecks}
              title="Effortless Task Mastery"
              description="Seamlessly create, categorize, and prioritize tasks with due dates, sub-checklists, and clear objectives. Transform overwhelming to-do lists into actionable plans."
            >
              <div className="mt-auto pt-4">
                <Image 
                  src="https://placehold.co/600x350.png" 
                  alt="Task Management Illustration"
                  width={600}
                  height={350}
                  className="rounded-lg object-cover w-full h-auto max-h-[200px] opacity-70 group-hover:opacity-90 transition-opacity"
                  data-ai-hint="task list interface"
                />
              </div>
            </BentoGridItem>

            <BentoGridItem
              className="lg:col-span-2 md:col-span-1 min-h-[200px]"
              icon={Brain}
              iconClassName="text-purple-500"
              title="AI-Powered Assistance"
              description="Leverage intelligent suggestions, task breakdown, and contextual help. Your smart study partner, integrated directly within your workflow."
            />

            <BentoGridItem
              className="lg:col-span-2 md:col-span-1 min-h-[200px]"
              icon={TrendingUp}
              iconClassName="text-green-500"
              title="Visual Progress Tracking"
              description="Monitor your accomplishments with intuitive visuals. Understand your productivity patterns and stay motivated as you see your progress unfold."
            />
            
            <BentoGridItem
              className="lg:col-span-2 md:col-span-1 min-h-[200px]"
              icon={LayoutPanelLeft}
              iconClassName="text-blue-500"
              title="Sleek & Intuitive Interface"
              description="Navigate a beautifully designed, clutter-free workspace. Enjoy a task management experience that’s both powerful and a pleasure to use."
            />

            <BentoGridItem
              className="lg:col-span-2 md:col-span-1 min-h-[200px]"
              icon={Filter}
              iconClassName="text-yellow-500"
              title="Stay Perfectly Organized"
              description="Utilize smart filters (All, Pending, Completed) and a dedicated trash section to keep your workspace tidy and focused."
            />

            <BentoGridItem
              className="lg:col-span-2 md:col-span-2 min-h-[200px] bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 group"
              icon={Sparkles}
              iconClassName="text-accent"
              title="Collaboration Hub (Coming Soon!)"
              description="Prepare to share projects, delegate tasks, and achieve goals together with classmates. Teamwork, simplified."
            >
                <div className="mt-auto pt-4 text-right">
                    <Badge variant="outline" className="border-primary/50 text-primary group-hover:bg-primary/10 transition-colors">Feature Launching Soon</Badge>
                </div>
            </BentoGridItem>
          </div>
        </div>
      </section>
      
      {/* CTA Section (Optional but good for UX) */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to Transform Your Productivity?</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">Join thousands of students who are already organizing their success with Upnext.</p>
          <Button asChild size="lg" className="text-base py-3.5 px-10 shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5">
            <Link href="/signup">Sign Up for Free Today</Link>
          </Button>
        </div>
      </section>


      {/* Footer (Simple) */}
      <footer className="py-10 text-center border-t border-border/20 bg-background">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Upnext. All rights reserved. Built with focus for students.
        </p>
      </footer>
    </div>
  );
}

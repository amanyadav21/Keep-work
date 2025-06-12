
"use client";

import React from 'react';
import { CheckSquare, CalendarClock, Zap, Users, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const BentoGridItem = ({
  icon: Icon,
  title,
  description,
  className,
  iconContainerClassName,
  iconClassName,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
}) => (
  <div className={cn(
    "rounded-xl shadow-lg p-6 md:p-8 flex flex-col transition-all duration-300 hover:scale-[1.03] hover:shadow-xl border border-border/30 hover:border-primary/70 group/bentoitem",
    className
    )}>
    <div className={cn(
      "mb-4 p-3 rounded-lg w-fit transition-colors duration-300 group-hover/bentoitem:shadow-inner group-hover/bentoitem:bg-opacity-80",
      iconContainerClassName
      )}>
      <Icon className={cn("h-8 w-8 md:h-10 md:w-10 transition-transform group-hover/bentoitem:scale-105", iconClassName)} />
    </div>
    <h3 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-sm md:text-base opacity-90 dark:opacity-80 leading-relaxed flex-grow">{description}</p>
  </div>
);

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Why Choose <span className="text-primary">Upnext</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the features that make Upnext the ultimate productivity tool for students. Our intuitive design helps you focus on what matters most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <BentoGridItem
            icon={CheckSquare}
            title="Smart Task Management"
            description="Organize your assignments, projects, and study schedule. Create custom categories, set priorities, and watch your productivity soar."
            className="md:col-span-3 lg:col-span-3 lg:row-span-2 bg-primary text-primary-foreground min-h-[300px] md:min-h-[400px]"
            iconContainerClassName="bg-primary-foreground/20 dark:bg-primary-foreground/10 group-hover/bentoitem:bg-primary-foreground/30"
            iconClassName="text-primary-foreground/90"
          />
          <BentoGridItem
            icon={CalendarClock}
            title="Deadline Tracking"
            description="Never miss a due date. Get notified about upcoming deadlines. Sync with your calendar for a seamless overview."
            className="md:col-span-2 lg:col-span-2 bg-accent text-accent-foreground"
            iconContainerClassName="bg-accent-foreground/20 dark:bg-accent-foreground/10 group-hover/bentoitem:bg-accent-foreground/30"
            iconClassName="text-accent-foreground"
          />
          <BentoGridItem
            icon={Zap}
            title="Focus Mode"
            description="Minimize distractions. Our focus mode helps you stay in the zone and get more done in less time."
            className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-teal-500 to-cyan-600 text-white"
            iconContainerClassName="bg-white/20 group-hover/bentoitem:bg-white/30"
            iconClassName="text-white/90"
          />
           <BentoGridItem
            icon={RefreshCw}
            title="Cross-Platform Sync"
            description="Access your tasks and schedule from anywhere, on any device. Your data is always up-to-date."
            className="md:col-span-3 lg:col-span-2 bg-card text-card-foreground"
            iconContainerClassName="bg-green-500/10 dark:bg-green-400/10 group-hover/bentoitem:bg-green-500/20"
            iconClassName="text-green-600 dark:text-green-400"
          />
          <BentoGridItem
            icon={Users}
            title="Collaboration Tools"
            description="Work together on group projects. Share tasks, assign responsibilities, and track progress in real-time. (Coming Soon)"
            className="md:col-span-2 lg:col-span-2 bg-muted text-muted-foreground"
            iconContainerClassName="bg-foreground/5 dark:bg-foreground/10 group-hover/bentoitem:bg-foreground/15"
            iconClassName="text-foreground/70"
          />
           <BentoGridItem
            icon={BarChart3}
            title="Progress Analytics"
            description="Visualize your productivity, identify patterns, and track improvements with insightful charts and reports. (Coming Soon)"
            className="md:col-span-3 lg:col-span-3 bg-muted text-muted-foreground"
            iconContainerClassName="bg-foreground/5 dark:bg-foreground/10 group-hover/bentoitem:bg-foreground/15"
            iconClassName="text-foreground/70"
          />
        </div>
      </div>
    </section>
  );
}

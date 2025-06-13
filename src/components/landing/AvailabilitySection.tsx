
"use client";

import React from 'react';
import { Smartphone, Tablet, Laptop, Globe, Mic, CalendarDays, AppWindow, Watch, Monitor, MousePointerSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple generic browser icon SVG if needed
const BrowserIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-6 w-6", className)}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="2" y1="9" x2="22" y2="9" />
    <line x1="5" y1="6" x2="7" y2="6" />
  </svg>
);


const platformIcons = [
  { name: 'Android', icon: Smartphone },
  { name: 'iPhone', icon: Smartphone },
  { name: 'iPad', icon: Tablet },
  { name: 'Mac', icon: Laptop },
  { name: 'Web', icon: Globe },
  { name: 'Siri', icon: Mic },
  { name: 'Calendar', icon: CalendarDays },
  { name: 'Windows', icon: AppWindow },
  { name: 'Chrome', icon: BrowserIcon }, // Using custom generic browser icon
  { name: 'Firefox', icon: BrowserIcon }, // Using custom generic browser icon
  { name: 'Apple Watch', icon: Watch },
  { name: 'Huawei', icon: Smartphone }, // Generic, as specific logo isn't in Lucide
  { name: 'Desktop', icon: Monitor },
];

export default function AvailabilitySection() {
  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-50 dark:opacity-30">
        {/* Soft background elements, can be reused from hero or be new */}
        <div
          className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full filter blur-3xl animate-pulse-slow"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full filter blur-3xl animate-pulse-slower animation-delay-2000"
          aria-hidden="true"
        />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div 
          className={cn(
            "relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px]",
            "rounded-full flex flex-col items-center justify-center text-center p-8 shadow-2xl",
            "bg-gradient-radial from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700"
          )}
          style={{
            // A simpler radial gradient for the sphere effect
            backgroundImage: 'radial-gradient(circle at 30% 30%, hsl(205, 90%, 65%), hsl(215, 80%, 55%))'
          }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 md:mb-8 !leading-tight px-4">
            Organize anything
            <br />
            with anyone,
            <br />
            anywhere
          </h2>

          <p className="text-sm text-blue-100 dark:text-blue-200 mb-3 md:mb-4">Available on:</p>
          
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 max-w-md">
            {platformIcons.map((platform) => (
              <div key={platform.name} className="flex flex-col items-center group">
                <platform.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-100 dark:text-blue-200 group-hover:text-white transition-colors" />
                <span className="text-[10px] sm:text-xs text-blue-200 dark:text-blue-300 mt-1 group-hover:text-white transition-colors">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
       {/* Add Tailwind keyframes if needed, or ensure global CSS has them */}
      <style jsx global>{`
        .animate-pulse-slow {
          animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-pulse-slower {
          animation: pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
        @keyframes pulse {
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </section>
  );
}

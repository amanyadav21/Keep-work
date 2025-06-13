
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Smartphone, Tablet, Laptop, Globe, Mic, CalendarDays, AppWindow, Watch } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple generic browser icon SVG
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

const platformDetails = [
  { name: 'Android', icon: Smartphone },
  { name: 'iPhone', icon: Smartphone },
  { name: 'iPad', icon: Tablet },
  { name: 'Mac', icon: Laptop },
  { name: 'Web', icon: Globe },
  { name: 'Siri', icon: Mic },
  { name: 'Calendar', icon: CalendarDays },
  { name: 'Windows', icon: AppWindow },
  { name: 'Chrome', icon: BrowserIcon },
  { name: 'Firefox', icon: BrowserIcon },
  { name: 'Apple Watch', icon: Watch },
  { name: 'Wear OS', icon: Watch },
];

export default function AvailabilitySection() {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Decorative background dots */}
      <div 
        className="absolute top-[10%] left-[5%] w-24 h-24 bg-pink-500/20 dark:bg-pink-500/10 rounded-full filter blur-2xl opacity-70 animate-pulse-slow"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-[15%] right-[8%] w-32 h-32 bg-green-500/20 dark:bg-green-500/10 rounded-full filter blur-3xl opacity-60 animate-pulse-slower animation-delay-1000"
        aria-hidden="true"
      />
       <div 
        className="absolute top-[20%] right-[15%] w-16 h-16 bg-blue-500/10 dark:bg-blue-500/5 rounded-full filter blur-xl opacity-50 animate-pulse-slow animation-delay-500"
        aria-hidden="true"
      />


      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div
          id="availability-circle"
          className={cn(
            "relative w-[380px] h-[380px] xs:w-[500px] xs:h-[500px] sm:w-[640px] sm:h-[640px] md:w-[780px] md:h-[780px] lg:w-[880px] lg:h-[880px]", 
            "rounded-full flex flex-col items-center justify-between text-center p-6 sm:p-8 md:p-10",
            "shadow-2xl transition-all duration-300 ease-out hover:scale-[1.01]",
            "hover:shadow-[0_20px_50px_-15px_rgba(76,29,149,0.4)] dark:hover:shadow-[0_20px_50px_-15px_rgba(120,80,200,0.3)]"
          )}
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(250, 80%, 80%), hsl(260, 85%, 65%), hsl(270, 75%, 50%))'
          }}
        >
          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white !leading-tight">
            Everything organized
            <br />
            Everyone connected,
            <br />
            Anywhere, anytime
          </h2>

          <p className="text-sm xs:text-base md:text-lg text-purple-100 dark:text-purple-200 mb-6 xs:mb-8 md:mb-10">
            Seamlessly available on all your devices:
          </p>

          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 gap-x-4 gap-y-3 sm:gap-x-5 sm:gap-y-4 md:gap-x-6 md:gap-y-5 mb-8 xs:mb-10 md:mb-12 max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            {platformDetails.map((platform) => (
              <div key={platform.name} className="flex flex-col items-center group hover:scale-110 transition-transform duration-150 ease-in-out">
                <platform.icon className="h-6 w-6 md:h-7 md:w-7 text-purple-100 dark:text-purple-200 group-hover:text-white transition-colors" />
                <span className="text-xs text-purple-200 dark:text-purple-300 mt-1.5 group-hover:text-white transition-colors">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>

          <Button 
            asChild 
            size="lg"
            className="bg-white text-purple-700 hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold py-3 px-8 rounded-full text-sm md:text-base"
          >
            <Link href="/signup">
              Get Started Free
            </Link>
          </Button>
        </div>
      </div>
      <style jsx global>{`
        .animate-pulse-slow {
          animation: pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-pulse-slower {
          animation: pulse 6.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-500 {
            animation-delay: 0.5s;
        }
        .animation-delay-1000 {
            animation-delay: 1s;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        /* Custom 'xs' breakpoint styles for Tailwind JIT */
         @media (min-width: 480px) { 
          .xs\\:w-\\[500px\\] { width: 500px !important; }
          .xs\\:h-\\[500px\\] { height: 500px !important; }
          .xs\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .xs\\:text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; } /* Tailwind text-4xl */
          .xs\\:text-base { font-size: 1rem !important; line-height: 1.5rem !important; } /* Tailwind text-base */
          .xs\\:mb-8 { margin-bottom: 2rem !important; } /* Tailwind mb-8 */
          .xs\\:mb-10 { margin-bottom: 2.5rem !important; } /* Tailwind mb-10 */
          .xs\\:mb-12 { margin-bottom: 3rem !important; } /* Tailwind mb-12 */
          .xs\\:max-w-xs { max-width: 20rem !important; } /* Tailwind max-w-xs */
        }
      `}</style>
    </section>
  );
}

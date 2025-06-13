
"use client";

import React from 'react';
import { 
  School, // For Google Classroom
  CalendarDays, 
  Slack as SlackIcon,
  FileText, // For Notion
  Figma as FigmaIcon,
  Video, // For Zoom
  GraduationCap, // For central app icon
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const integrations = [
  { name: 'Google Classroom', icon: School, angle: 0 },
  { name: 'Figma', icon: FigmaIcon, angle: 60 },
  { name: 'Slack', icon: SlackIcon, angle: 120 },
  { name: 'Google Calendar', icon: CalendarDays, angle: 180 },
  { name: 'Notion', icon: FileText, angle: 240 },
  { name: 'Zoom', icon: Video, angle: 300 },
];

// Helper to convert degrees to radians
const toRadians = (degrees: number) => degrees * (Math.PI / 180);

const OrbitingIcon = ({ 
  icon: Icon, 
  angle, 
  radiusPercentage,
  name
}: { 
  icon: React.ElementType; 
  angle: number; 
  radiusPercentage: { sm: number; md: number; lg: number };
  name: string;
}) => {
  const adjustedAngle = angle - 90;
  const xSm = 50 + radiusPercentage.sm * Math.cos(toRadians(adjustedAngle));
  const ySm = 50 + radiusPercentage.sm * Math.sin(toRadians(adjustedAngle));
  const xMd = 50 + radiusPercentage.md * Math.cos(toRadians(adjustedAngle));
  const yMd = 50 + radiusPercentage.md * Math.sin(toRadians(adjustedAngle));
  const xLg = 50 + radiusPercentage.lg * Math.cos(toRadians(adjustedAngle));
  const yLg = 50 + radiusPercentage.lg * Math.sin(toRadians(adjustedAngle));

  return (
    <div
      className={cn(
        "absolute z-20 transform -translate-x-1/2 -translate-y-1/2 p-3.5 sm:p-4", // Increased padding
        "bg-card/70 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 hover:border-primary/30", // Enhanced glass effect
        "transition-all duration-300 ease-out group hover:scale-110 hover:shadow-primary/20" // Enhanced hover
      )}
      style={{
        top: `${ySm}%`, left: `${xSm}%`,
        // Note: True responsive radius might need JS or more complex CSS.
        // This approach relies on parent scaling and fixed percentages for the orbit path.
      }}
    >
      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-foreground/80 group-hover:text-primary transition-colors" /> {/* Increased icon size */}
      <span className="sr-only">{name}</span>
    </div>
  );
};

export default function IntegrationsSection() {
  const orbitRadius = { sm: 38, md: 40, lg: 42 };

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center justify-center bg-primary/10 text-primary py-1.5 px-5 rounded-full text-sm font-semibold mb-5 shadow-sm border border-primary/20">
            <Share2 className="h-4 w-4 mr-2.5" />
            Connect Your Universe
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-foreground !leading-tight">
            Works With Your Favorite Tools
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upnext seamlessly integrates with the apps you rely on every day, creating a unified hub for your academic life.
          </p>
        </div>

        <div 
          id="integration-hub" 
          className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[550px] lg:h-[550px] mx-auto"
        >
          {/* Concentric Blurred Circles - Background for Hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[95%] h-[95%] bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-pulse-integrations-slow animation-delay-1000"></div>
            <div className="absolute w-[80%] h-[80%] bg-accent/5 dark:bg-accent/10 rounded-full filter blur-2xl opacity-40 animate-pulse-integrations-slower"></div>
            <div className="absolute w-[65%] h-[65%] bg-foreground/2 dark:bg-white/5 rounded-full filter blur-xl opacity-60 animate-pulse-integrations-slow animation-delay-500"></div>
          </div>

          {/* Central App Icon */}
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10",
            "p-5 sm:p-6 bg-card rounded-2xl shadow-2xl border border-border/20" // Slightly increased padding and border
          )}>
            <GraduationCap className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-primary" /> {/* Increased central icon size */}
          </div>

          {/* Orbiting Integration Icons */}
          {integrations.map((integration) => (
            <OrbitingIcon
              key={integration.name}
              icon={integration.icon}
              angle={integration.angle}
              radiusPercentage={orbitRadius}
              name={integration.name}
            />
          ))}
          
          {/* Faint Connecting Lines (Decorative) */}
          {integrations.map((integration, index) => (
            <div
              key={`line-${index}`}
              className="absolute top-1/2 left-1/2 w-[1px] h-[42%] sm:h-[40%] md:h-[42%] origin-top transform -translate-x-1/2 "
              style={{ 
                rotate: `${integration.angle}deg`, 
                background: 'radial-gradient(ellipse at top, hsl(var(--border)/0.2) 0%, transparent 70%)', // Softer lines
              }}
            />
          ))}

        </div>
        <div className="mt-16 text-center">
            <p className="text-md text-muted-foreground">
                ...and more integrations are on the way!
            </p>
        </div>
      </div>
      <style jsx global>{`
        .animate-pulse-integrations-slow {
          animation: pulse-integrations 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-pulse-integrations-slower {
          animation: pulse-integrations 7.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-500 {
            animation-delay: 0.5s;
        }
        .animation-delay-1000 {
            animation-delay: 1s;
        }
        @keyframes pulse-integrations { /* Renamed to avoid conflict if 'pulse' is used elsewhere */
          0%, 100% {
            opacity: 0.3; /* More subtle base opacity */
            transform: scale(0.97);
          }
          50% {
            opacity: 0.5; /* More subtle peak opacity */
            transform: scale(1.03);
          }
        }
      `}</style>
    </section>
  );
}


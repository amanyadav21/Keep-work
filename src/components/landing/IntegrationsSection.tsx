
"use client";

import React from 'react';
import { 
  School, 
  CalendarDays, 
  FolderKanban, 
  Mail, 
  Slack as SlackIcon, // Renamed to avoid conflict with 'Slack' type if it exists
  Video, 
  FileText, 
  Trello as TrelloIcon, // Renamed
  Github as GithubIcon, // Renamed
  Figma as FigmaIcon, // Renamed
  Sparkles,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const integrations = [
  { name: 'Google Classroom', icon: School, description: "Sync assignments & deadlines." },
  { name: 'Google Calendar', icon: CalendarDays, description: "Manage events & schedules." },
  { name: 'Google Drive', icon: FolderKanban, description: "Access your files seamlessly." },
  { name: 'Outlook', icon: Mail, description: "Connect your emails & tasks." },
  { name: 'Slack', icon: SlackIcon, description: "Collaborate with your team." },
  { name: 'Zoom', icon: Video, description: "Schedule & join meetings." },
  { name: 'Notion', icon: FileText, description: "Organize notes & projects." },
  { name: 'Trello', icon: TrelloIcon, description: "Visualize your workflow." },
  { name: 'GitHub', icon: GithubIcon, description: "Track coding projects." },
  { name: 'Figma', icon: FigmaIcon, description: "Link design files." },
];

const IntegrationCard = ({ name, icon: Icon, description }: { name: string; icon: React.ElementType; description: string }) => (
  <div className={cn(
    "bg-card p-6 rounded-xl border border-border/50 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-out group transform hover:-translate-y-1 flex flex-col items-center text-center"
  )}>
    <div className="mb-4 p-3 bg-muted/70 dark:bg-muted/50 rounded-full transition-colors duration-300 group-hover:bg-primary/10">
      <Icon className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
    {/* <p className="text-xs text-muted-foreground">{description}</p> */}
  </div>
);

export default function IntegrationsSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-background via-muted/10 to-background border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 md:mb-16">
           <div className="inline-flex items-center justify-center bg-primary/10 text-primary py-1 px-4 rounded-full text-sm font-medium mb-4 shadow-sm border border-primary/20">
            <Share2 className="h-4 w-4 mr-2" />
            Seamless Connections
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground !leading-tight">
            Integrate With Your Favorite Tools
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upnext works with the apps you already love, centralizing your workflow and boosting your productivity. More integrations coming soon!
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
          {integrations.map((integration) => (
            <IntegrationCard 
              key={integration.name} 
              name={integration.name} 
              icon={integration.icon} 
              description={integration.description} 
            />
          ))}
        </div>
         <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground italic">
                And many more to come... We're always working to expand our ecosystem.
            </p>
        </div>
      </div>
    </section>
  );
}

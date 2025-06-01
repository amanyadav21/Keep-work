
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, CheckSquare, CalendarClock, Zap, Users, BarChart3, RefreshCw, CheckCircle, Star, Twitter, Facebook, Instagram, Linkedin, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LandingHeader } from '@/components/LandingHeader';

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
    "rounded-xl shadow-lg p-6 md:p-8 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-transparent hover:border-primary/20", 
    className
    )}>
    <div className={cn("mb-4 p-3 rounded-lg w-fit transition-colors duration-300", iconContainerClassName)}>
      <Icon className={cn("h-8 w-8 md:h-10 md:w-10", iconClassName)} />
    </div>
    <h3 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-sm md:text-base opacity-90 dark:opacity-80 leading-relaxed flex-grow">{description}</p>
  </div>
);

const PricingCard = ({
  planName,
  price,
  priceDetails,
  features,
  buttonText,
  buttonVariant = "default",
  isPopular = false,
  actionLink = "/signup"
}: {
  planName: string;
  price: string;
  priceDetails: string;
  features: string[];
  buttonText: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  isPopular?: boolean;
  actionLink?: string;
}) => (
  <div className={cn(
    "bg-card text-card-foreground p-6 md:p-8 rounded-xl shadow-xl flex flex-col h-full relative border-2",
    isPopular ? "border-primary scale-[1.03] shadow-primary/20" : "border-border"
  )}>
    {isPopular && (
      <div className="absolute top-0 right-4 -mt-3">
        <Badge className="bg-accent text-accent-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">Popular</Badge>
      </div>
    )}
    <h3 className="text-2xl font-semibold mb-1 text-foreground">{planName}</h3>
    <p className="text-muted-foreground text-sm mb-4">{priceDetails}</p>
    <div className="mb-6">
      <span className="text-5xl font-bold text-foreground">{price}</span>
      <span className="text-muted-foreground">/month</span>
    </div>
    <ul className="space-y-3 mb-8 flex-grow">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2.5 shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground">{feature}</span>
        </li>
      ))}
    </ul>
    <Button asChild size="lg" variant={isPopular ? 'default' : buttonVariant} className={cn("w-full mt-auto", isPopular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80 text-foreground')}>
      <Link href={actionLink}>{buttonText}</Link>
    </Button>
  </div>
);

const TestimonialCard = ({ quote, author, role, avatar }: { quote: string; author: string; role: string; avatar: string }) => (
  <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
    <p className="text-muted-foreground italic mb-4">"{quote}"</p>
    <div className="flex items-center">
      <Image src={avatar} alt={author} width={40} height={40} className="rounded-full mr-3" data-ai-hint="person avatar" />
      <div>
        <p className="font-semibold text-foreground">{author}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  </div>
);


export function LandingPage() {
  return (
    <>
      <LandingHeader />
      <div className="flex flex-col min-h-screen bg-background text-foreground"> 
        
        <section className="relative py-20 md:py-32 lg:py-40 px-4 text-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 opacity-50"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="#features" className="inline-flex items-center justify-center gap-2 mb-6 px-4 py-1.5 bg-card text-sm font-medium text-primary rounded-full border border-primary/20 shadow-md group hover:shadow-lg transition-shadow">
              <Sparkles className="h-4 w-4 text-primary/80 group-hover:text-primary transition-colors" />
              Plan. Track. Achieve. Effortlessly.
              <ArrowRight className="h-4 w-4 text-primary/80 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </Link>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 !leading-tight text-foreground">
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
              <Button asChild variant="outline" size="lg" className="text-base py-3.5 px-8 bg-card hover:bg-muted border-border hover:border-primary/70 transition-all group text-foreground">
                <Link href="/login">
                  I already have an account
                  <ArrowRight className="ml-2 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

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
                iconContainerClassName="bg-primary-foreground/20 dark:bg-primary-foreground/10"
                iconClassName="text-primary-foreground/90"
              />
              <BentoGridItem
                icon={CalendarClock}
                title="Deadline Tracking"
                description="Never miss a due date. Get notified about upcoming deadlines. Sync with your calendar for a seamless overview."
                className="md:col-span-2 lg:col-span-2 bg-accent/10 text-accent-foreground dark:text-accent"
                iconContainerClassName="bg-accent/20 dark:bg-accent/10"
                iconClassName="text-accent"
              />
              <BentoGridItem
                icon={Zap}
                title="Focus Mode"
                description="Minimize distractions. Our focus mode helps you stay in the zone and get more done in less time."
                className="md:col-span-2 lg:col-span-2 bg-secondary text-secondary-foreground"
                iconContainerClassName="bg-primary/10 dark:bg-primary/5"
                iconClassName="text-primary"
              />
               <BentoGridItem
                icon={RefreshCw}
                title="Cross-Platform Sync"
                description="Access your tasks and schedule from anywhere, on any device. Your data is always up-to-date."
                className="md:col-span-3 lg:col-span-2 bg-card text-card-foreground"
                iconContainerClassName="bg-primary/10 dark:bg-primary/5"
                iconClassName="text-primary"
              />
              <BentoGridItem
                icon={Users}
                title="Collaboration Tools"
                description="Work together on group projects. Share tasks, assign responsibilities, and track progress in real-time. (Coming Soon)"
                className="md:col-span-2 lg:col-span-2 bg-muted text-muted-foreground"
                iconContainerClassName="bg-primary/10 dark:bg-primary/5"
                iconClassName="text-primary"
              />
               <BentoGridItem
                icon={BarChart3}
                title="Progress Analytics"
                description="Visualize your productivity, identify patterns, and track improvements with insightful charts and reports. (Coming Soon)"
                className="md:col-span-3 lg:col-span-3 bg-card text-card-foreground"
                iconContainerClassName="bg-accent/20 dark:bg-accent/10"
                iconClassName="text-accent"
              />
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-16 md:py-24 bg-background border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Loved by Students Like You</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                See how Upnext is helping students stay organized and achieve their goals.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TestimonialCard 
                quote="Upnext completely changed how I manage my coursework. I'm less stressed and more productive than ever!"
                author="Sarah L."
                role="University Student"
                avatar="https://placehold.co/80x80.png"
              />
              <TestimonialCard 
                quote="The deadline tracking and priority features are lifesavers. I finally feel on top of my assignments."
                author="Michael B."
                role="College Sophomore"
                avatar="https://placehold.co/80x80.png"
              />
            </div>
          </div>
        </section>
        
        <section id="pricing" className="py-16 md:py-24 bg-muted/30 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Choose the plan that's right for your academic journey. No hidden fees, ever.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              <PricingCard
                planName="Basic"
                price="Free"
                priceDetails="For individuals getting started."
                features={["Up to 3 active projects", "Basic task management", "Email reminders", "Limited AI Assistant"]}
                buttonText="Get Started"
                buttonVariant="outline"
              />
              <PricingCard
                planName="Pro"
                price="$5"
                priceDetails="For students needing more power."
                features={["Unlimited projects", "Advanced task management", "Full AI Assistant access", "Focus mode & analytics", "Priority support", "Calendar integration"]}
                buttonText="Choose Pro"
                isPopular={true}
              />
              <PricingCard
                planName="Team"
                price="$15"
                priceDetails="For study groups and clubs."
                features={["All Pro features", "Shared workspaces", "Team collaboration tools", "Admin controls", "Dedicated AI support"]}
                buttonText="Contact Sales"
                buttonVariant="outline"
                actionLink="/contact-sales" 
              />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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

        <footer className="py-12 md:py-16 bg-card border-t border-border text-muted-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 items-start">
              
              <div className="sm:col-span-2 lg:col-span-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                <Link href="/" className="flex items-center space-x-2 mb-4 group">
                  <span className="font-bold text-2xl text-foreground group-hover:text-primary transition-colors">Upnext</span>
                </Link>
                <p className="text-sm leading-relaxed">
                  Empowering students to achieve more with an intuitive task management platform.
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-foreground mb-4 uppercase tracking-wider text-sm">Product</h5>
                <ul className="space-y-2.5 text-sm">
                  <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
                  <li><Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                  <li><Link href="/#testimonials" className="hover:text-primary transition-colors">Testimonials</Link></li>
                  <li><Link href="/updates" className="hover:text-primary transition-colors opacity-70">Updates (Soon)</Link></li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold text-foreground mb-4 uppercase tracking-wider text-sm">Resources</h5>
                <ul className="space-y-2.5 text-sm">
                  <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                  <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                  <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
              
              <div>
                 <h5 className="font-semibold text-foreground mb-4 uppercase tracking-wider text-sm">Connect With Us</h5>
                <div className="flex space-x-4 mb-4">
                  <Link href="#" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
                  <Link href="#" aria-label="Facebook" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
                  <Link href="#" aria-label="Instagram" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></Link>
                  <Link href="#" aria-label="LinkedIn" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
                </div>
                <p className="text-xs">Stay updated with our latest news and features.</p>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-border/60 text-center text-sm">
              &copy; {new Date().getFullYear()} Upnext. All rights reserved. Built for educational and demonstration purposes.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}


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
    "rounded-xl shadow-lg p-6 md:p-8 flex flex-col transition-all duration-300 hover:scale-[1.03] hover:shadow-xl border border-border/30 hover:border-primary/70 group/bentoitem", // Added group/bentoitem
    className
    )}>
    <div className={cn(
      "mb-4 p-3 rounded-lg w-fit transition-colors duration-300 group-hover/bentoitem:shadow-inner group-hover/bentoitem:bg-opacity-80", // Subtle icon container hover
      iconContainerClassName
      )}>
      <Icon className={cn("h-8 w-8 md:h-10 md:w-10 transition-transform group-hover/bentoitem:scale-105", iconClassName)} /> {/* Icon scale on hover */}
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
    <Button
      asChild
      size="lg"
      variant={isPopular ? 'default' : buttonVariant}
      className={cn(
        "w-full mt-auto",
        isPopular && "bg-primary text-primary-foreground hover:bg-primary/90", 
        !isPopular && buttonVariant === 'default' && "bg-muted hover:bg-muted/80 text-foreground", 
      )}
    >
      <Link href={actionLink}>{buttonText}</Link>
    </Button>
  </div>
);

const TestimonialCard = ({
  quote,
  avatarSrc,
  avatarHint,
  name,
  title,
  stars = 5,
  className,
}: {
  quote: string;
  avatarSrc: string;
  avatarHint: string;
  name: string;
  title: string;
  stars?: number;
  className?: string;
}) => (
  <Card className={cn("p-6 md:p-8 shadow-lg flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl", className)}>
    <div className="flex mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={cn("h-5 w-5", i < stars ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
      ))}
    </div>
    <p className="text-base md:text-lg italic text-foreground/90 mb-6 flex-grow">"{quote}"</p>
    <div className="flex flex-col items-center">
      <Image
        src={avatarSrc}
        alt={`Avatar of ${name}`}
        width={56}
        height={56}
        className="rounded-full mb-3 shadow-md"
        data-ai-hint={avatarHint}
      />
      <h4 className="font-semibold text-foreground">{name}</h4>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  </Card>
);


export function LandingPage() {
  return (
    <>
      <LandingHeader />
      <div className="flex flex-col min-h-screen bg-background text-foreground"> 
        
        <section className="relative py-20 md:py-32 lg:py-40 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-x-0 top-0 h-3/4 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-75"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge 
              variant="outline" 
              className="mb-6 px-4 py-2 text-sm font-medium text-primary border-primary/50 shadow-md group hover:shadow-lg transition-shadow hover:bg-primary/10 cursor-default bg-background"
              asChild={false} 
            >
              <Link href="#features" className="inline-flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary/80 group-hover:text-primary transition-colors" />
                Plan. Track. Achieve. Effortlessly.
                <ArrowRight className="h-4 w-4 text-primary/80 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 !leading-tight text-foreground">
              Elevate Your Productivity with <span className="text-primary">Upnext</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Upnext is your intelligent task management hub, meticulously designed for students. Streamline your workflow, conquer deadlines, and unlock your full academic potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base py-3.5 px-8 shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5 group">
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
        
        <section id="testimonials" className="py-16 md:py-24 bg-background border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Loved by Students Like You
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how Upnext is helping students stay organized and achieve their academic goals.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <TestimonialCard
                quote="Upnext has revolutionized how I manage my coursework. The deadline tracking is a lifesaver!"
                avatarSrc="https://placehold.co/100x100.png"
                avatarHint="student avatar"
                name="Sarah L."
                title="University Student"
              />
              <TestimonialCard
                quote="The focus mode and smart task categorization are game-changers. I'm getting so much more done."
                avatarSrc="https://placehold.co/100x100.png"
                avatarHint="college student"
                name="David K."
                title="College Sophomore"
                className="md:scale-105 bg-card/90 dark:bg-card/60 md:shadow-2xl border-primary/30"
                stars={5}
              />
              <TestimonialCard
                quote="Finally, a task manager that understands student life! The AI assistant is surprisingly helpful for brainstorming."
                avatarSrc="https://placehold.co/100x100.png"
                avatarHint="graduate student"
                name="Maria P."
                title="Graduate Researcher"
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
                buttonVariant="default" 
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

        <section className="relative py-16 md:py-24 bg-primary text-primary-foreground overflow-hidden">
          <div
            className="absolute inset-0 -z-0 opacity-[0.03] bg-gradient-to-tr from-transparent via-white to-transparent"
            style={{
              backgroundImage: `
                linear-gradient(45deg, currentColor 25%, transparent 25%), 
                linear-gradient(-45deg, currentColor 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, currentColor 75%),
                linear-gradient(-45deg, transparent 75%, currentColor 75%)`,
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


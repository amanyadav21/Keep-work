
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  planName: string;
  price: string;
  priceDetails: string;
  features: string[];
  buttonText: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  isPopular?: boolean;
  actionLink?: string;
  featureLayout?: 'single-column' | 'two-columns';
  className?: string;
}

const PricingCard = ({
  planName,
  price,
  priceDetails,
  features,
  buttonText,
  buttonVariant = "default",
  isPopular = false,
  actionLink = "/signup",
  featureLayout = 'single-column',
  className
}: PricingCardProps) => (
  <div className={cn(
    "p-6 md:p-8 rounded-xl shadow-xl flex flex-col h-full relative border-2 transition-all duration-300 ease-out",
    isPopular 
      ? "bg-primary text-primary-foreground border-primary/50 scale-[1.02] shadow-primary/20 hover:scale-[1.05] hover:shadow-primary/30" 
      : "bg-card text-card-foreground border-border hover:scale-[1.03] hover:shadow-2xl",
    className
  )}>
    {isPopular && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3.5">
        <Badge className="bg-accent text-accent-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-md">Most Popular</Badge>
      </div>
    )}
    <h3 className={cn("text-2xl font-semibold mb-1", isPopular ? "text-primary-foreground" : "text-foreground")}>{planName}</h3>
    <p className={cn("text-sm mb-4", isPopular ? "text-primary-foreground/80" : "text-muted-foreground")}>{priceDetails}</p>
    <div className="mb-6">
      <span className={cn("text-5xl font-bold", isPopular ? "text-primary-foreground" : "text-foreground")}>{price}</span>
      { price !== "$0" && <span className={cn(isPopular ? "text-primary-foreground/80" : "text-muted-foreground")}>/month</span>}
    </div>
    <ul className={cn(
        "space-y-3 mb-8 flex-grow",
        featureLayout === 'two-columns' && "md:grid md:grid-cols-2 md:gap-x-6 md:space-y-0"
        )}>
      {features.map((feature, index) => (
        <li key={index} className={cn("flex items-start", featureLayout === 'two-columns' && index >= features.length / 2 && "mt-3 md:mt-0")}>
          <CheckCircle className={cn("h-5 w-5 mr-2.5 shrink-0 mt-0.5", isPopular ? "text-accent" : "text-green-500")} />
          <span className={cn("text-sm", isPopular ? "text-primary-foreground/90" : "text-muted-foreground")}>{feature}</span>
        </li>
      ))}
    </ul>
    <Button
      asChild
      size="lg"
      variant={isPopular ? 'default' : buttonVariant} 
      className={cn(
        "w-full mt-auto font-semibold group",
        isPopular && "bg-accent text-accent-foreground hover:bg-accent/90", 
        !isPopular && buttonVariant === 'outline' && "border-primary text-primary hover:bg-primary/10",
        !isPopular && buttonVariant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      <Link href={actionLink}>
        {buttonText}
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </Button>
  </div>
);

export default function PricingSection() {
  const freeFeatures = [
    "Basic Task Management",
    "Up to 3 Projects",
    "Limited AI Assistant Usage",
    "Community Support",
  ];

  const professionalFeatures = [
    "All Free Features",
    "Up to 10 Projects",
    "Standard AI Assistant Access",
    "Email Reminders",
    "Priority Community Support"
  ];

  const unlimitedFeatures = [
    "Unlimited Tasks & Projects",
    "Full AI Assistant Access",
    "Calendar Integration",
    "Focus Mode",
    "Progress Analytics",
    "Priority Email Support",
    "Collaboration (Soon)"
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground !leading-tight">
            Unlock Your Potential with <br className="hidden sm:block" /> Clear, Simple Pricing.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Choose the plan that best fits your academic journey with Upnext.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <PricingCard
            planName="Free"
            price="$0"
            priceDetails="For individuals getting started."
            features={freeFeatures}
            buttonText="Get Started Free"
            buttonVariant="outline"
            actionLink="/signup?plan=free"
          />
          <PricingCard
            planName="Professional"
            price="$2"
            priceDetails="Ideal for individual students."
            features={professionalFeatures}
            buttonText="Start Professional"
            buttonVariant="default"
            actionLink="/signup?plan=professional"
          />
          <PricingCard
            planName="Unlimited"
            price="$7"
            priceDetails="For students seeking maximum productivity."
            features={unlimitedFeatures}
            featureLayout="two-columns"
            buttonText="Go Unlimited"
            isPopular={true} 
            actionLink="/signup?plan=unlimited"
            className="lg:pt-10" 
          />
        </div>
      </div>
    </section>
  );
}

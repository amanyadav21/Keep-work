
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        !isPopular && buttonVariant === 'outline' && "border-primary text-primary hover:bg-primary/10", // Updated for outline button
        !isPopular && buttonVariant === 'default' && "bg-muted hover:bg-muted/80 text-foreground"
      )}
    >
      <Link href={actionLink}>{buttonText}</Link>
    </Button>
  </div>
);

export default function PricingSection() {
  return (
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
  );
}

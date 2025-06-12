
"use client";

import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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

export default function TestimonialsSection() {
  return (
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
  );
}


"use client";

import Link from 'next/link';
import { Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FooterSection() {
  return (
    <footer className="py-12 md:py-16 bg-card border-t border-border text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 items-start">
          
          {/* Brand Column */}
          <div className="sm:col-span-2 md:col-span-1 flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link href="/" className="flex items-center space-x-2 mb-4 group">
              <span className="font-bold text-2xl text-foreground group-hover:text-primary transition-colors">Upnext</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Empowering students to achieve more with an intuitive task management platform.
            </p>
          </div>

          {/* Product Links */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h5 className="font-semibold text-foreground mb-4 uppercase tracking-wider text-sm">Product</h5>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/updates" className="hover:text-primary transition-colors opacity-70">Updates (Soon)</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h5 className="font-semibold text-foreground mb-4 uppercase tracking-wider text-sm">Resources</h5>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          {/* Connect With Us */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
             <h5 className="font-semibold text-foreground mb-4 uppercase tracking-wider text-sm">Connect With Us</h5>
            <div className="flex space-x-4 mb-4">
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></Link>
              <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
            </div>
            <p className="text-xs">Stay updated with our latest news and features.</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/60 text-center text-sm">
          &copy; {new Date().getFullYear()} Upnext. All rights reserved. Built for educational and demonstration purposes.
        </div>
      </div>
    </footer>
  );
}

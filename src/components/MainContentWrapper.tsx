
"use client";

import type { ReactNode } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

// MainContentWrapper to handle dynamic margin-left for the main content area
export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth(); // Get user and authLoading state
  const { effectiveSidebarWidth } = useSidebar();

  // If auth is still loading, or if user is not authenticated, don't apply sidebar margin.
  // This allows LandingPage (shown when !user) and auth pages to be full width.
  const marginLeftToApply = !authLoading && user ? effectiveSidebarWidth : '0px';

  return (
    <div
      className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out"
      style={{
        marginLeft: marginLeftToApply,
      }}
    >
      {children}
    </div>
  );
}

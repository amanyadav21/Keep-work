"use client";

import type { ReactNode } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

// MainContentWrapper to handle dynamic margin-left for the main content area
export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  // useSidebar will throw an error if SidebarContext is null (i.e., not within a SidebarProvider),
  // which is the correct behavior.
  const { effectiveSidebarWidth } = useSidebar();

  // The effectiveSidebarWidth from context.useSidebar() already considers
  // mobile state (returns '0px' for mobile) and collapsed/expanded states for desktop.
  return (
    <div
      className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out"
      style={{
        marginLeft: effectiveSidebarWidth,
      }}
    >
      {children}
    </div>
  );
}

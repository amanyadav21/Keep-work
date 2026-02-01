"use client";

import { useSidebar } from '@/components/ui/sidebar';

// MainContentWrapper to handle dynamic margin-left for the main content area
export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const { effectiveSidebarWidth } = useSidebar();

  return (
    <div
      className="flex-1 flex flex-col min-w-0 transition-[margin-left] duration-200 ease-in-out"
      style={{
        marginLeft: effectiveSidebarWidth,
      }}
    >
      {children}
    </div>
  );
}

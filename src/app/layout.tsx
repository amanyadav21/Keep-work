
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MainContentWrapper } from '@/components/MainContentWrapper'; // Import the new client component

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Upnext',
  description: 'Smart Task Manager for Students',
};

// MainContentWrapper definition is now in src/components/MainContentWrapper.tsx

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} font-sans antialiased bg-background`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <SidebarProvider 
              collapsible="icon" 
              defaultOpen={true}
              sidebarWidthExpanded="var(--sidebar-width-expanded)"
              sidebarIconWidth="var(--sidebar-width-collapsed)"
            >
              <div className="flex min-h-screen w-full"> {/* Ensures full height and acts as flex container */}
                {/* AppSidebar is rendered by page.tsx conditionally based on auth state */}
                <MainContentWrapper>
                  {children}
                </MainContentWrapper>
              </div>
              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

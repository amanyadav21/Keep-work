
import type { Metadata } from 'next';
import { Manrope, Roboto_Mono } from 'next/font/google'; // Changed from Roboto to Manrope
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/ui/sidebar'; // Removed SidebarInset import

const manrope = Manrope({ // Changed from roboto to manrope
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Manrope typical weights
});

const robotoMono = Roboto_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Upnext | Smart Task Manager',
  description: 'Smart Task Manager for Students',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${robotoMono.variable} font-sans antialiased`} // Changed from roboto.variable
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {/* SidebarProvider is no longer needed here as it's part of page.tsx specific layout */}
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

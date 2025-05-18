
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google'; // Keep Manrope
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';

const manrope = Manrope({ 
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'], 
});

// Roboto_Mono removed

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
        className={`${manrope.variable} font-sans antialiased`} // Roboto_Mono variable removed
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

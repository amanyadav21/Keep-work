
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

const manrope = Manrope({ 
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'], 
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
        className={`${manrope.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider> {/* Wrap with AuthProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

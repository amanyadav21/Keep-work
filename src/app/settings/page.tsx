
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Bell, Globe, Trash2, UserCog, Moon, Sun, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true); // Placeholder state

  useEffect(() => {
    setMounted(true);
  }, []);

  if (authLoading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !authLoading && mounted) {
    router.push('/login');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }
  
  if (!user) { // Should be caught by above, but as a fallback
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Please log in to view settings.</p>
        <Button onClick={() => router.push('/login')} className="ml-2">Login</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <header className="py-4 px-4 md:px-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
            Application Settings
          </h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  {theme === 'dark' ? <Moon className="h-5 w-5 mr-3 text-primary" /> : <Sun className="h-5 w-5 mr-3 text-primary" />}
                  <Label htmlFor="dark-mode" className="font-medium">
                    Dark Mode
                  </Label>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle dark mode"
                  disabled={!mounted} // Ensure theme is only changed when mounted
                />
              </div>
              {/* Add more appearance settings here if needed */}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Profile Settings</CardTitle>
              <CardDescription>Manage your public profile and account preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  {profileVisible ? <Eye className="h-5 w-5 mr-3 text-green-600" /> : <EyeOff className="h-5 w-5 mr-3 text-muted-foreground" />}
                  <Label htmlFor="profile-visibility" className="font-medium">
                    Public Profile Visibility
                  </Label>
                </div>
                <Switch
                  id="profile-visibility"
                  checked={profileVisible}
                  onCheckedChange={setProfileVisible}
                  disabled // Placeholder
                  aria-label="Toggle profile visibility"
                />
              </div>
              <p className="text-xs text-muted-foreground px-3">
                Note: Public profile features are under development. This setting is currently a placeholder.
              </p>
            </CardContent>
             <CardFooter className="text-sm text-muted-foreground border-t pt-4">
              Your email: {user.email} (This cannot be changed here)
            </CardFooter>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-3 text-primary" />
                  <Label htmlFor="email-notifications" className="font-medium">
                    Email Notifications for Due Dates
                  </Label>
                </div>
                <Switch id="email-notifications" disabled aria-label="Toggle email notifications" />
              </div>
              <p className="text-xs text-muted-foreground px-3 pt-2">Notification settings are coming soon.</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Language & Region</CardTitle>
              <CardDescription>Set your preferred language and regional formats.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-3 text-primary" />
                  <Label htmlFor="language-select" className="font-medium">
                    Language
                  </Label>
                </div>
                <Button variant="outline" size="sm" disabled>English (US)</Button>
              </div>
              <p className="text-xs text-muted-foreground px-3 pt-2">Language selection features are planned.</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-destructive/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center text-destructive">
                <UserCog className="h-5 w-5 mr-2" />
                Account Management
              </CardTitle>
              <CardDescription className="text-destructive/90">Manage your account data or delete your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full" disabled>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
              <p className="text-xs text-destructive/80 mt-2 text-center">
                Account deletion is permanent and cannot be undone. This feature is not yet active.
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}

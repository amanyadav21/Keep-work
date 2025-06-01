
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Edit3, User, CalendarDays, Activity, Link as LinkIcon, Loader2, ShieldCheck, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Please log in to view your profile.</p>
        <Button onClick={() => router.push('/login')} className="ml-2">Login</Button>
      </div>
    );
  }

  const joinDate = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
  const formattedJoinDate = joinDate ? format(joinDate, "MMMM d, yyyy") : "Date not available";
  const userInitial = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()
    : user.email ? user.email[0].toUpperCase() : '?';


  return (
    <div className="flex flex-col min-h-screen bg-muted/40 dark:bg-background">
      <header className="py-4 px-4 md:px-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
            Your Profile
          </h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <Card className="shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent p-1">
              <CardHeader className="flex flex-col sm:flex-row items-start gap-4 space-y-0 pb-4 bg-card rounded-t-lg">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-md">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User Avatar'} data-ai-hint="user avatar" />
                  <AvatarFallback className="bg-muted text-lg sm:text-xl font-semibold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 mt-2 sm:mt-0">
                  <CardTitle className="text-2xl sm:text-3xl font-bold">{user.displayName || user.email?.split('@')[0] || "User"}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-1">{user.email}</CardDescription>
                  <div className="mt-3 flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mr-1.5 text-primary" />
                    Joined: {formattedJoinDate}
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled className="mt-2 sm:mt-0 sm:ml-auto">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardHeader>
            </div>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">User ID</h4>
                <p className="text-sm text-foreground bg-muted/50 px-3 py-1.5 rounded-md break-all">{user.uid}</p>
              </div>
               <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Account Status</h4>
                <p className="text-sm text-green-600 dark:text-green-500 font-medium flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1.5" /> Verified
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Activity Summary
              </CardTitle>
              <CardDescription>Overview of your task management and contributions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Placeholder for activity charts or stats */}
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-foreground">Tasks Completed:</p>
                <p className="text-sm font-semibold text-primary">N/A</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-foreground">Average Completion Time:</p>
                <p className="text-sm font-semibold text-primary">N/A</p>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">Detailed activity metrics coming soon...</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Palette className="h-5 w-5 mr-2 text-primary" />
                Preferences
              </CardTitle>
              <CardDescription>Your application display and interaction settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-foreground">Theme:</p>
                <p className="text-sm font-medium text-foreground capitalize">{mounted ? (localStorage.getItem('theme') || 'System') : 'System'}</p>
              </div>
               <div className="mt-4 text-center">
                 <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                   Go to Settings
                 </Button>
               </div>
            </CardContent>
             <CardFooter className="text-xs text-muted-foreground border-t pt-3 mt-2">
              Manage all your settings in the dedicated settings page.
            </CardFooter>
          </Card>

        </div>
      </main>
    </div>
  );
}

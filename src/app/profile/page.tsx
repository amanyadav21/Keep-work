
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Edit3, User, CalendarDays, Activity, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }

  const joinDate = user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date();

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
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
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
              <Avatar className="h-20 w-20 border-2 border-primary/50">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User Avatar'} data-ai-hint="user avatar" />
                <AvatarFallback className="bg-muted">
                  <User className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{user.displayName || user.email?.split('@')[0] || "User"}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  Joined: {format(joinDate, "MMMM d, yyyy")}
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-sm text-foreground break-all">{user.uid}</p>
                </div>
                {/* More profile fields can be added here as they become available */}
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
            <CardContent>
              <p className="text-sm text-muted-foreground">Activity metrics coming soon...</p>
              {/* Placeholder for activity charts or stats */}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <LinkIcon className="h-5 w-5 mr-2 text-primary" />
                Connected Accounts
              </CardTitle>
              <CardDescription>Manage your linked accounts for seamless integration.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Google/GitHub account linking coming soon...</p>
              {/* Placeholder for connected accounts display */}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}

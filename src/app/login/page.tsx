
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// GoogleIcon component removed

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { logIn, loading } = useAuth(); // signInWithGoogle removed
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); 
    const result = await logIn(email, password);
    if (result.error) {
      setError(result.error); 
    }
  };

  // handleGoogleSignIn function removed

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Log in to continue to Upnext.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6"> {/* Adjusted spacing from space-y-4 */}
          <form onSubmit={handleSubmit} className="space-y-6"> {/* Adjusted spacing from space-y-4 */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-base"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center px-2 py-1 bg-destructive/10 rounded-md">{error}</p>}
            <Button type="submit" className="w-full text-base py-3" disabled={loading}>
              {loading && !password ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading && password ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Log In'}
            </Button>
          </form>

          {/* "Or continue with" separator and Google Sign-In button removed */}

        </CardContent>
        <CardFooter className="flex justify-center pt-2"> {/* Adjusted padding-top */}
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}


"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUserType,
  type AuthError
} from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';

// Define a common result type for auth operations
export type AuthResult = { user: FirebaseUserType | null; error: string | null };

interface AuthContextType {
  user: FirebaseUserType | null;
  loading: boolean;
  signUp: (email: string, pass: string) => Promise<AuthResult>;
  logIn: (email: string, pass: string) => Promise<AuthResult>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUserType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Optional: Could consider a light "Session restored" toast or just silent update
      } else {
        // User is signed out
      }
    });
    return () => unsubscribe();
  }, [router]);

  const signUp = async (email: string, pass: string): Promise<AuthResult> => {
    setLoading(true);
    if (typeof window !== "undefined") {
      console.log("signUp: Attempting from origin:", window.location.origin);
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || email.split('@')[0],
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        console.log("New user signed up and data saved to Firestore:", firebaseUser.displayName || email.split('@')[0]);
      }
      toast({ title: "Signup Successful", description: "Welcome!" });
      router.push('/');
      return { user: firebaseUser, error: null };
    } catch (error) {
      const authError = error as AuthError;
      console.error("Signup error:", authError.code, authError.message);
      let description: string;
      switch (authError.code) {
        case 'auth/email-already-in-use':
          description = "This email address is already in use. Please try logging in or use a different email.";
          break;
        case 'auth/weak-password':
          description = "The password is too weak. Please choose a stronger password (at least 6 characters).";
          break;
        case 'auth/invalid-email':
          description = "The email address is not valid. Please enter a valid email.";
          break;
        default:
          description = "An unexpected error occurred during signup. Please try again or contact support if the issue persists.";
      }
      return { user: null, error: description };
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string): Promise<AuthResult> => {
    setLoading(true);
    if (typeof window !== "undefined") {
      console.log("logIn: Attempting from origin:", window.location.origin);
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
        });
        console.log("User logged in, lastLogin updated:", firebaseUser.displayName);
      }

      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/');
      return { user: firebaseUser, error: null };
    } catch (error) {
      const authError = error as AuthError;
      console.error("Login error:", authError.code, authError.message);
      let description: string;
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = "Invalid email or password. Please check your credentials and try again.";
          break;
        case 'auth/user-disabled':
          description = "This user account has been disabled. Please contact support.";
          break;
        case 'auth/too-many-requests':
          description = "Access to this account has been temporarily disabled due to many failed login attempts. You can try again later or reset your password.";
          break;
        default:
          description = "An unexpected error occurred during login. Please try again or contact support if the issue persists.";
      }
      return { user: null, error: description };
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      const authError = error as AuthError;
      console.error("Logout error:", authError.code, authError.message);
      toast({ title: "Logout Failed", description: authError.message || "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    logIn,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

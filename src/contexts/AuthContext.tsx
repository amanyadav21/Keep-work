
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
  signInWithGoogle: () => Promise<AuthResult>;
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
      console.error("Signup error:", authError);
      let description = "An unexpected error occurred during signup. Please try again.";
      if (authError.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please try logging in or use a different email.";
      } else if (authError.code === 'auth/weak-password') {
        description = "The password is too weak. Please choose a stronger password.";
      } else if (authError.message) {
        description = authError.message;
      }
      // toast({ title: "Signup Failed", description, variant: "destructive" }); // Error is returned to be displayed on form
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
      console.error("Login error:", authError);
      let description = "An unexpected error occurred during login. Please try again.";
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        description = "Invalid email or password. Please check your credentials and try again.";
      } else if (authError.code === 'auth/user-disabled') {
        description = "This user account has been disabled.";
      } else if (authError.message) {
        description = authError.message; 
      }
      // toast({ title: "Login Failed", description, variant: "destructive" }); // Error is returned to be displayed on form
      return { user: null, error: description };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    setLoading(true);
    try {
      // Check if user is ALREADY signed in (e.g., via another tab or recent same-tab action)
      if (auth.currentUser) {
        console.log("User already signed in (auth.currentUser exists), attempting to sync data:", auth.currentUser.email);
        await manageGoogleUserData(auth.currentUser, toast);
        // setUser(auth.currentUser); // Let onAuthStateChanged handle global state update
        // router.push('/'); // Let onAuthStateChanged handle navigation
        return { user: auth.currentUser, error: null };
      }

      const provider = new GoogleAuthProvider();
      if (typeof window !== "undefined") {
        console.log("Attempting Google Sign-In from origin:", window.location.origin);
      }
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (googleUser) {
        await manageGoogleUserData(googleUser, toast);
        // setUser(googleUser); // Let onAuthStateChanged handle global state update
        // router.push('/'); // Let onAuthStateChanged handle navigation
        return { user: googleUser, error: null };
      }
      
      // This case should ideally not be reached if signInWithPopup is successful
      toast({ title: "Google Sign-In Issue", description: "Google Sign-In did not complete as expected.", variant: "destructive" });
      return { user: null, error: "Google Sign-In did not return a user."};

    } catch (error) {
      const authError = error as AuthError;
      console.error("Google Sign-In error:", authError);
      let description = "An unexpected error occurred during Google Sign-In.";
      let toastVariant: "default" | "destructive" | null | undefined = "destructive";

      if (authError.code === 'auth/popup-closed-by-user') {
        description = "Google Sign-In popup was closed. Please try again if you wish to sign in with Google.";
        toastVariant = "default";
      } else if (authError.code === 'auth/account-exists-with-different-credential') {
        description = "An account already exists with this email. Please sign in using the original method.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        description = `The domain ${typeof window !== "undefined" ? window.location.hostname : 'your app domain'} is not authorized for Google Sign-In. Please add it to your Firebase project's authentication settings.`;
      } else if (authError.code === 'auth/operation-not-allowed') {
        description = "Google Sign-In is not enabled for this project. Please enable it in the Firebase console (Authentication -> Sign-in method). Also, ensure your Project support email is set.";
      } else if (authError.message) {
        description = authError.message;
      }
      toast({ title: "Google Sign-In Not Completed", description, variant: toastVariant });
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
    signInWithGoogle,
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


"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUserType, 
  type AuthError
} from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

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
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      
      if (userCredential.user) {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          uid: userCredential.user.uid,
          displayName: userCredential.user.displayName || email.split('@')[0],
          email: userCredential.user.email,
          photoURL: userCredential.user.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        console.log("New user signed up and data saved to Firestore:", userCredential.user.displayName || email.split('@')[0]);
      }
      
      setUser(userCredential.user);
      toast({ title: "Signup Successful", description: "Welcome!" });
      router.push('/'); 
      return { user: userCredential.user, error: null };
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
      toast({ title: "Signup Failed", description, variant: "destructive" });
      return { user: null, error: description };
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      
      if (userCredential.user) {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
        });
        console.log("User logged in, lastLogin updated:", userCredential.user.displayName);
      }

      setUser(userCredential.user);
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/'); 
      return { user: userCredential.user, error: null };
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
      toast({ title: "Login Failed", description, variant: "destructive" });
      return { user: null, error: description };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      if (typeof window !== "undefined") {
        console.log("Attempting Google Sign-In from origin:", window.location.origin);
      }

      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (googleUser) {
        const userDocRef = doc(db, "users", googleUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
          await setDoc(userDocRef, {
            uid: googleUser.uid,
            displayName: googleUser.displayName,
            email: googleUser.email,
            photoURL: googleUser.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
          console.log("New user signed in with Google and data saved to Firestore:", googleUser.displayName);
          toast({ title: "Sign-in Successful", description: `Welcome, ${googleUser.displayName}!` });
        } else {
          await updateDoc(userDocRef, {
            lastLogin: serverTimestamp(),
            displayName: googleUser.displayName, 
            photoURL: googleUser.photoURL,
          });
          console.log("Existing user signed in with Google:", googleUser.displayName);
          toast({ title: "Welcome Back", description: `Signed in as ${googleUser.displayName}!` });
        }
        setUser(googleUser);
        router.push('/');
        return { user: googleUser, error: null };
      }
      return { user: null, error: "Google Sign-In did not return a user."}; // Should not happen if signInWithPopup succeeds
    } catch (error) {
      const authError = error as AuthError;
      console.error("Google Sign-In error:", authError);
      let description = "An unexpected error occurred during Google Sign-In.";
      if (authError.code === 'auth/popup-closed-by-user') {
        description = "Google Sign-In popup was closed. Please try again.";
      } else if (authError.code === 'auth/account-exists-with-different-credential') {
        description = "An account already exists with this email. Please sign in using the original method.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        description = `The domain ${typeof window !== "undefined" ? window.location.hostname : 'your app domain'} is not authorized for Google Sign-In. Please add it to your Firebase project's authentication settings.`;
      } else if (authError.code === 'auth/operation-not-allowed') {
        description = "Google Sign-In is not enabled for this project. Please enable it in the Firebase console (Authentication -> Sign-in method).";
      } else if (authError.message) {
        description = authError.message;
      }
      toast({ title: "Google Sign-In Failed", description, variant: "destructive" });
      return { user: null, error: description };
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); 
    } catch (error) {
      const authError = error as AuthError;
      console.error("Logout error:", authError);
      toast({ title: "Logout Failed", description: authError.message || "An unexpected error occurred.", variant: "destructive" });
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

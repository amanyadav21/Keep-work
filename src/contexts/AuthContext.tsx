
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

// Helper function to manage Firestore user data for Google Sign-In
async function manageGoogleUserData(googleUser: FirebaseUserType, currentToast: ReturnType<typeof useToast>['toast']): Promise<void> {
  const userDocRef = doc(db, "users", googleUser.uid);
  try {
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
      console.log("New Google user data saved to Firestore:", googleUser.displayName);
      currentToast({ title: "Account Created", description: `Welcome, ${googleUser.displayName}! Your account has been set up.` });
    } else {
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        displayName: googleUser.displayName, // Keep displayName and photoURL synced
        photoURL: googleUser.photoURL,
      });
      console.log("Existing Google user data updated:", googleUser.displayName);
      currentToast({ title: "Welcome Back", description: `Signed in as ${googleUser.displayName}!` });
    }
  } catch (firestoreError) {
    console.error("Error managing Google user data in Firestore:", firestoreError);
    currentToast({
      title: "Data Sync Error",
      description: "Could not save or update your user information. Please try again.",
      variant: "destructive",
    });
    // Optionally re-throw or handle more specifically if needed
  }
}


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
        // router.push('/'); // Re-evaluate if this auto-redirect here is always desired
      } else {
        // User is signed out
      }
    });
    return () => unsubscribe();
  }, [router]); // Added router to dependency array if it's used inside useEffect

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
      // setUser(firebaseUser); // Let onAuthStateChanged handle this
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

      // setUser(firebaseUser); // Let onAuthStateChanged handle this
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
    const currentHostname = typeof window !== "undefined" ? window.location.origin : 'your app domain (unknown)';
    console.log("signInWithGoogle: Attempting Google Sign-In...");
    console.log("signInWithGoogle: Current auth.currentUser:", auth.currentUser);
    if (typeof window !== "undefined") {
      console.log("signInWithGoogle: Current window.location.origin:", window.location.origin);
      console.log("signInWithGoogle: Firebase App Name:", auth.app.name);
    }

    try {
      if (auth.currentUser) {
        console.log("signInWithGoogle: User already signed in, attempting to sync data:", auth.currentUser.email);
        await manageGoogleUserData(auth.currentUser, toast);
        return { user: auth.currentUser, error: null };
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' }); // Ensure account selection dialog

      console.log("signInWithGoogle: Calling signInWithPopup...");
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      console.log("signInWithGoogle: signInWithPopup successful. User:", googleUser);

      if (googleUser) {
        await manageGoogleUserData(googleUser, toast);
        router.push('/');
        return { user: googleUser, error: null };
      }

      console.warn("signInWithGoogle: signInWithPopup returned, but no googleUser object.");
      toast({ title: "Google Sign-In Issue", description: "Google Sign-In did not complete as expected (no user object).", variant: "destructive" });
      return { user: null, error: "Google Sign-In did not return a user."};

    } catch (error) {
      const authError = error as AuthError;
      console.error("signInWithGoogle: Full error object:", JSON.stringify(authError, null, 2));
      console.error("signInWithGoogle: Error code:", authError.code);
      console.error("signInWithGoogle: Error message:", authError.message);

      let description = `An unexpected error occurred during Google Sign-In from '${currentHostname}'. Please check the browser console for more details.`;
      let toastVariant: "default" | "destructive" | null | undefined = "destructive";
      
      if (authError.code === 'auth/popup-closed-by-user') {
        description = `Google Sign-In popup was closed. This often means the current domain ('${currentHostname}') is not in your Firebase project's "Authorized domains" list. Also, ensure "Project support email" is set in your Google Cloud Console (OAuth consent screen). Other causes: Pop-up blockers. Please verify these configurations in Firebase and Google Cloud Console.`;
        toastVariant = "default";
      } else if (authError.code === 'auth/cancelled-popup-request') {
        description = "Google Sign-In was cancelled. Another popup may have been opened or the request was cancelled by the browser.";
        toastVariant = "default";
      } else if (authError.code === 'auth/popup-blocked') {
        description = "Google Sign-In popup was blocked by the browser. Please disable your pop-up blocker for this site and try again.";
        toastVariant = "default";
      } else if (authError.code === 'auth/account-exists-with-different-credential') {
        description = "An account already exists with this email. Please sign in using the original method.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        description = `The domain '${currentHostname}' is not authorized for Google Sign-In. Please add it to your Firebase project's 'Authorized domains' list (Authentication -> Settings -> Authorized domains).`;
      } else if (authError.code === 'auth/operation-not-allowed') {
        description = "Google Sign-In is not enabled for this project. Please enable it in the Firebase console (Authentication -> Sign-in method). Also, ensure your 'Project support email' is set in the Google Cloud Console OAuth consent screen.";
      } else if (authError.message) {
        description = authError.message;
      }
      toast({ title: "Google Sign-In Not Completed", description, variant: toastVariant, duration: 20000 });
      return { user: null, error: description };
    } finally {
      setLoading(false);
      console.log("signInWithGoogle: Process finished.");
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // setUser(null); // Let onAuthStateChanged handle this
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


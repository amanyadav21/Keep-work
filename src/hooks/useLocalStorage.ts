
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // This function is executed only on the initial render.
    if (typeof window === 'undefined') {
      // Guard for SSR, where localStorage is not available.
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // If item exists in localStorage, parse and return it.
        return JSON.parse(item) as T;
      } else {
        // If no item in localStorage, store the initialValue there and return it.
        // This ensures consistency if initialValue itself is used by the component
        // before this hook fully "settles" with a value from storage.
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
    } catch (error) {
      console.error(`Error reading/initializing localStorage key "${key}":`, error);
      // In case of an error (e.g., parsing error, localStorage disabled),
      // attempt to set initialValue in localStorage, then return initialValue.
      // This ensures the app can still function with the initialValue even if localStorage fails.
      try {
          window.localStorage.setItem(key, JSON.stringify(initialValue));
      } catch (writeError) {
          console.error(`Error writing initialValue to localStorage for key "${key}" after read error:`, writeError);
      }
      return initialValue;
    }
  });

  // Effect to update localStorage when storedValue or key changes.
  // This effect runs after the initial render and on subsequent updates to storedValue.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;

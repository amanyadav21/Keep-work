"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to run on mount to load from localStorage
  useEffect(() => {
    // This check ensures localStorage is accessed only on the client
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        } else {
          // If no item, set initialValue to localStorage
          window.localStorage.setItem(key, JSON.stringify(initialValue));
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        setStoredValue(initialValue);
      }
    }
  }, [key, initialValue]);


  // Effect to update localStorage when storedValue changes
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

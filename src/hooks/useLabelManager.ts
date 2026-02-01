"use client";

import useLocalStorage from './useLocalStorage';
import type { Label } from '@/types';

export function useLabelManager() {
  const [labels, setLabels] = useLocalStorage<Label[]>('upnext_labels', [
    { id: '1', name: 'Work', color: '#ef4444', userId: 'local' },
    { id: '2', name: 'Personal', color: '#22c55e', userId: 'local' },
  ]);

  const addLabel = (name: string, color: string) => {
    const newLabel: Label = {
      id: crypto.randomUUID(),
      name,
      color,
      userId: 'local',
      createdAt: new Date().toISOString()
    };
    setLabels(prev => [...prev, newLabel]);
  };

  const deleteLabel = (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
  };
    
  return { labels, addLabel, deleteLabel };
}

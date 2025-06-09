
import { Suspense } from 'react';
import PerformancePageContent from './PerformancePageContent';
import { Loader2 } from 'lucide-react';

export default function PerformancePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <PerformancePageContent />
    </Suspense>
  );
}

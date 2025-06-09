
import { Suspense } from 'react';
import AIAssistantPageContent from './AIAssistantPageContent';
import { Loader2 } from 'lucide-react';

interface AIAssistantPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function AIAssistantPage({ searchParams }: AIAssistantPageProps) {
  // Destructure only the taskDescription from searchParams
  const { taskDescription: taskDescriptionParam } = searchParams;

  const initialTaskDescription = Array.isArray(taskDescriptionParam)
    ? taskDescriptionParam[0]
    : typeof taskDescriptionParam === 'string'
    ? taskDescriptionParam
    : null;

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <AIAssistantPageContent initialTaskDescription={initialTaskDescription} />
    </Suspense>
  );
}

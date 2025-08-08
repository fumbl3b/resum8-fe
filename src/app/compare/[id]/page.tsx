'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { ComparisonSession } from '@/lib/types';
import { Stepper } from '@/components/comparison/Stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileUp } from 'lucide-react';
import { DiffView } from '@/components/comparison/DiffView';
import { ExportModal } from '@/components/comparison/ExportModal';
import { Skeleton } from '@/components/ui/skeleton';

export default function ComparisonSessionPage() {
  const params = useParams();
  const sessionId = parseInt(params.id as string);
  const [session, setSession] = useState<ComparisonSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const pollSession = async () => {
      try {
        const data = await apiClient.getComparison(sessionId);
        setSession(data);

        if (data.status !== 'DONE' && data.status !== 'ERROR') {
          setTimeout(pollSession, 2000);
        }
      } catch (err) {
        setError('Failed to fetch comparison session.');
      }
    };

    pollSession();
  }, [sessionId]);

  const steps = session?.steps ? Object.entries(session.steps).map(([name, { state }]) => ({ name, status: state })) : [];

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">{error}</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <Skeleton className="h-8 w-full" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <Stepper steps={steps} />
        <Button onClick={() => setIsExportModalOpen(true)} disabled={session.status !== 'DONE'}>
          <FileUp className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {session.diff_json && session.explanations ? (
            <DiffView 
              diffJson={session.diff_json} 
              explanations={session.explanations} 
            />
          ) : (
            <p>Loading comparison...</p>
          )}
        </CardContent>
      </Card>

      {session.status === 'ERROR' && (
        <div className="mt-8 text-center text-red-500">
          <p>An error occurred during the comparison process.</p>
        </div>
      )}

      <ExportModal 
        sessionId={sessionId} 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        initialPdfUrl={session.pdf_url}
      />
    </div>
  );
}

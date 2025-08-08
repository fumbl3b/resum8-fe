'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { ComparisonSession } from '@/lib/types';
import { Stepper } from '@/components/comparison/Stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

export default function ComparisonSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<ComparisonSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const pollSession = async () => {
      try {
        const data = await apiClient.getComparison(parseInt(sessionId));
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
    return <div className="container mx-auto py-10 text-center">Loading session...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Stepper steps={steps} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Original Resume</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>{session.previews?.base_text}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improved Resume</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            {session.improved_text ? (
              <p>{session.improved_text}</p>
            ) : (
              <p>Improvements will appear here when ready.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {session.status === 'DONE' && session.pdf_url && (
        <div className="mt-8 text-center">
          <Button onClick={() => apiClient.downloadComparison(session.id)}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      )}

      {session.status === 'ERROR' && (
        <div className="mt-8 text-center text-red-500">
          <p>An error occurred during the comparison process.</p>
        </div>
      )}
    </div>
  );
}

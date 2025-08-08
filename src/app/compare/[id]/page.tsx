'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { ComparisonSession } from '@/lib/types';

export default function ComparisonSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<ComparisonSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const pollSession = async () => {
      try {
        const data = await apiClient.getComparison(parseInt(sessionId));
        setSession(data);

        if (data.status === 'DONE' || data.status === 'ERROR') {
          // Stop polling
        } else {
          setTimeout(pollSession, 2000);
        }
      } catch (err) {
        setError('Failed to fetch comparison session.');
      }
    };

    pollSession();
  }, [sessionId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!session) {
    return <div>Session not found.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Comparison Session</h1>
      <p className="text-lg text-muted-foreground mb-8">Status: {session.status}</p>

      {/* Add progress steps, previews, and diff view here */}
    </div>
  );
}

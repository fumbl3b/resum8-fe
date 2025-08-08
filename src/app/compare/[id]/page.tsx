'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { ComparisonSession } from '@/lib/types';
import { Stepper } from '@/components/comparison/Stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { DiffView } from '@/components/comparison/DiffView';
import { ExportModal } from '@/components/comparison/ExportModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

export default function ComparisonSessionPage() {
  const params = useParams();
  const sessionId = parseInt(params.id as string);
  const [session, setSession] = useState<ComparisonSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const fetchSession = useCallback(async () => {
    try {
      const data = await apiClient.getComparison(sessionId);
      setSession(data);
      setError(null);
      setRetryCount(0);
      return data;
    } catch (err) {
      console.error('Failed to fetch comparison session:', err);
      throw err;
    }
  }, [sessionId]);

  const pollSession = useCallback(async () => {
    try {
      const data = await fetchSession();
      
      if (data.status === 'ERROR') {
        setError('The comparison process encountered an error. You can retry the operation.');
        return;
      }
      
      if (data.status !== 'DONE') {
        pollTimeoutRef.current = setTimeout(pollSession, 2000);
      } else {
        toast({
          title: "Comparison Complete!",
          description: "Your resume comparison is ready.",
        });
      }
    } catch (err) {
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        toast({
          title: "Connection Error",
          description: `Retrying... (${retryCount + 1}/${maxRetries})`,
          variant: "destructive",
        });
        pollTimeoutRef.current = setTimeout(pollSession, 5000);
      } else {
        setError('Failed to fetch comparison session. Please try refreshing the page.');
      }
    }
  }, [fetchSession, retryCount, toast]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setRetryCount(0);
    
    try {
      await pollSession();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    
    pollSession();
    
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [sessionId, pollSession]);

  const steps = session?.steps ? Object.entries(session.steps).map(([name, { state }]) => ({ name, status: state })) : [];
  
  const getProgress = () => {
    if (!session?.steps) return 0;
    const totalSteps = Object.keys(session.steps).length;
    const completedSteps = Object.values(session.steps).filter(step => step.state === 'DONE').length;
    return Math.round((completedSteps / totalSteps) * 100);
  };
  
  const getStatusMessage = () => {
    if (!session) return 'Loading...';
    if (session.status === 'PENDING') return 'Initializing comparison...';
    if (session.status === 'RUNNING') return 'Processing your resume...';
    if (session.status === 'DONE') return 'Comparison complete!';
    if (session.status === 'ERROR') return 'Comparison failed';
    return 'Unknown status';
  };

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={handleRetry} disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Resume Comparison</h1>
              {session.status === 'RUNNING' && (
                <div className="text-sm text-blue-600 font-medium">
                  {getProgress()}% Complete
                </div>
              )}
            </div>
            <p className="text-muted-foreground">{getStatusMessage()}</p>
          </div>
          <Button onClick={() => setIsExportModalOpen(true)} disabled={session.status !== 'DONE'}>
            <FileUp className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        
        {session.status === 'RUNNING' && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        )}
        
        <Stepper steps={steps} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Results
            {retryCount > 0 && (
              <span className="text-sm text-amber-600 font-normal">
                (Reconnected after {retryCount} attempt{retryCount > 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {session.diff_json && session.explanations ? (
            <DiffView 
              diffJson={session.diff_json} 
              explanations={session.explanations} 
            />
          ) : session.status === 'RUNNING' ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-muted-foreground">Analyzing and improving your resume...</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Waiting for comparison results...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {session.status === 'ERROR' && (
        <Card className="mt-8">
          <CardContent className="text-center py-6">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Comparison Failed</h3>
            <p className="text-red-500 mb-4">
              An error occurred during the comparison process. This might be due to file format issues or server problems.
            </p>
            <Button onClick={handleRetry} disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Comparison
                </>
              )}
            </Button>
          </CardContent>
        </Card>
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

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';

interface SessionPollingOptions {
  sessionId: number | null;
  interval?: number;
  maxAttempts?: number;
  onUpdate?: (session: any) => void;
  onComplete?: (session: any) => void;
  onError?: (error: Error) => void;
  shouldPoll?: (session: any) => boolean;
}

export function useSessionPolling({
  sessionId,
  interval = 7000, // Increased to 7 seconds for more conservative polling
  maxAttempts = 60,
  onUpdate,
  onComplete,
  onError,
  shouldPoll = (session) => session.status !== 'DONE' && session.status !== 'ERROR'
}: SessionPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    attemptsRef.current = 0;
  }, []);

  const pollSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      console.log(`🔍 Making API call to getComparisonSession(${sessionId}) at ${new Date().toLocaleTimeString()}`);
      const session = await apiClient.getComparisonSession(sessionId);
      
      onUpdate?.(session);

      if (!shouldPoll(session)) {
        stopPolling();
        onComplete?.(session);
        return;
      }

      attemptsRef.current++;
      if (attemptsRef.current >= maxAttempts) {
        stopPolling();
        onError?.(new Error('Maximum polling attempts reached'));
      }
    } catch (error) {
      stopPolling();
      onError?.(error instanceof Error ? error : new Error('Unknown polling error'));
    }
  }, [sessionId, onUpdate, onComplete, onError, shouldPoll, maxAttempts, stopPolling]);

  const startPolling = useCallback(() => {
    if (!sessionId) return;
    
    // Always clear existing interval before starting new one
    if (intervalRef.current) {
      console.log('🧹 Clearing existing polling interval before starting new one');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log('▶️ Starting new polling interval for session:', sessionId);
    attemptsRef.current = 0;
    intervalRef.current = setInterval(pollSession, interval);
    pollSession(); // Initial poll
  }, [sessionId, interval, pollSession]);

  useEffect(() => {
    console.log('🔄 Polling hook useEffect triggered:', { sessionId, hasInterval: intervalRef.current !== null });
    if (sessionId) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [sessionId, startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling: intervalRef.current !== null
  };
}
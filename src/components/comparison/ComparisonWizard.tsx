'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChooseInputsStep } from './ChooseInputsStep';
import { apiClient } from '@/lib/api';
import { useGlobalStore } from '@/stores/global-store';

export function ComparisonWizard() {
  const router = useRouter();
  const { userSummary } = useGlobalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartComparison = async (
    comparisonType: string, 
    altResumeId?: number, 
    jobDescription?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const base_resume_id = userSummary?.default_resume_id;
      if (!base_resume_id) {
        throw new Error('No default resume set.');
      }

      const response = await apiClient.startComparison({
        base_resume_id,
        alt_resume_id: comparisonType === 'default-vs-another' ? altResumeId : undefined,
        job_description: jobDescription,
      });

      router.push(`/compare/${response.id}`);
    } catch (err) {
      setError('Failed to start comparison.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ChooseInputsStep onNext={handleStartComparison} />
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {isLoading && <p>Starting comparison...</p>}
    </div>
  );
}

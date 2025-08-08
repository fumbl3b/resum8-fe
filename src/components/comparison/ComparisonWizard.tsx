'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChooseInputsStep } from './ChooseInputsStep';
import { apiClient } from '@/lib/api';
import { useGlobalStore } from '@/stores/global-store';
import { useToast } from '@/components/ui/use-toast';

export function ComparisonWizard() {
  const router = useRouter();
  const { userSummary } = useGlobalStore();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartComparison = async (
    comparisonType: string, 
    altResumeId?: number, 
    jobDescription?: string
  ) => {
    setIsLoading(true);

    try {
      const base_resume_id = userSummary?.default_resume_id;
      if (!base_resume_id) {
        toast({
          title: "Error",
          description: "Please set a default resume first.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await apiClient.startComparison({
        base_resume_id,
        alt_resume_id: comparisonType === 'default-vs-another' ? altResumeId : undefined,
        job_description: jobDescription,
      });

      toast({
        title: "Comparison Started!",
        description: "Your resume is being optimized.",
      });
      router.push(`/compare/${response.id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start comparison.",
        variant: "destructive",
      });
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

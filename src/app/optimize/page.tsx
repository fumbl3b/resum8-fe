'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export default function OptimizePage() {
  const router = useRouter();
  const { 
    jobDescription,
    resumeText,
    optimizationResults,
    setOptimizationResults,
    setCurrentStep
  } = useAppStore();

  const optimizeMutation = useMutation({
    mutationFn: () => apiClient.suggestImprovements({
      resume_text: resumeText,
      job_description: jobDescription
    }),
    onSuccess: (data) => {
      setOptimizationResults(data);
    },
    onError: (error) => {
      console.error('Failed to get optimization suggestions:', error);
    },
  });

  useEffect(() => {
    if (!jobDescription || !resumeText) {
      router.push('/upload');
      return;
    }

    if (!optimizationResults && !optimizeMutation.isPending) {
      optimizeMutation.mutate();
    }
  }, [jobDescription, resumeText, optimizationResults, optimizeMutation, router]);

  const handleNext = () => {
    setCurrentStep('generate');
    router.push('/generate');
  };

  const handleBack = () => {
    setCurrentStep('analyze');
    router.push('/analyze');
  };


  if (!jobDescription || !resumeText) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Analysis
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Resume Optimization
            </h1>
            <div className="w-40" />
          </div>

          {optimizeMutation.isPending && (
            <Card className="mb-8">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Analyzing your resume...</p>
                  <p className="text-sm text-muted-foreground">
                    Comparing against job requirements and generating suggestions
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {optimizeMutation.isError && (
            <Card className="mb-8 border-destructive/50 bg-destructive/10">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-lg font-medium text-destructive mb-2">
                    Optimization Failed
                  </p>
                  <p className="text-sm text-destructive/80 mb-4">
                    We couldn't analyze your resume. Please try again.
                  </p>
                  <Button
                    onClick={() => optimizeMutation.mutate()}
                    variant="outline"
                  >
                    Retry Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {optimizationResults && (
            <>
              {/* Suggestions */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>AI-Powered Optimization Suggestions</CardTitle>
                  <CardDescription>
                    Personalized recommendations to improve your resume for this job
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {optimizationResults.suggestions}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Step */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Optimized Resume</CardTitle>
                  <CardDescription>
                    Ready to create a professional LaTeX resume with these optimizations?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Apply these suggestions to generate your optimized resume
                    </div>
                    <Button
                      onClick={handleNext}
                      className="flex items-center gap-2"
                    >
                      Generate Resume
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeywordDisplay } from '@/components/analysis/keyword-display';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export default function AnalyzePage() {
  const router = useRouter();
  const { 
    jobDescription, 
    resumeText, 
    jobAnalysis, 
    setJobAnalysis, 
    setCurrentStep 
  } = useAppStore();

  const analyzeMutation = useMutation({
    mutationFn: () => apiClient.analyzeJob({ job_description: jobDescription }),
    onSuccess: (data) => {
      setJobAnalysis(data);
    },
    onError: (error) => {
      console.error('Failed to analyze job:', error);
    },
  });

  useEffect(() => {
    if (!jobDescription || !resumeText) {
      router.push('/upload');
      return;
    }

    if (!jobAnalysis && !analyzeMutation.isPending) {
      analyzeMutation.mutate();
    }
  }, [jobDescription, resumeText, jobAnalysis, analyzeMutation, router]);

  const handleNext = () => {
    setCurrentStep('optimize');
    router.push('/optimize');
  };

  const handleBack = () => {
    setCurrentStep('upload');
    router.push('/upload');
  };

  const canProceed = !!jobAnalysis;

  if (!jobDescription || !resumeText) {
    return null; // Will redirect to upload
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Upload
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Job Analysis Results
            </h1>
            <div className="w-32" />
          </div>

          {analyzeMutation.isPending && (
            <Card className="mb-8">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Analyzing job description...</p>
                  <p className="text-sm text-muted-foreground">
                    Our AI is extracting keywords, requirements, and insights
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {analyzeMutation.isError && (
            <Card className="mb-8 border-destructive/50 bg-destructive/10">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-lg font-medium text-destructive mb-2">
                    Analysis Failed
                  </p>
                  <p className="text-sm text-destructive/80 mb-4">
                    We couldn't analyze the job description. Please try again.
                  </p>
                  <Button
                    onClick={() => analyzeMutation.mutate()}
                    variant="outline"
                  >
                    Retry Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {jobAnalysis && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <KeywordDisplay
                  title="Key Skills & Keywords"
                  description="Important keywords found in the job description"
                  keywords={jobAnalysis.keywords || []}
                />
                
                <KeywordDisplay
                  title="Job Benefits"
                  description="Benefits and perks mentioned in the posting"
                  keywords={jobAnalysis.benefits || []}
                  variant="secondary"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <KeywordDisplay
                  title="Requirements"
                  description="Must-have qualifications and skills"
                  keywords={jobAnalysis.requirements || []}
                  variant="outline"
                />

                {jobAnalysis.insights?.required_skills && (
                  <KeywordDisplay
                    title="Required Skills"
                    description="Essential technical and soft skills"
                    keywords={jobAnalysis.insights.required_skills}
                    variant="destructive"
                  />
                )}
              </div>

              {jobAnalysis.insights && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>AI Insights</CardTitle>
                    <CardDescription>
                      Additional insights extracted from the job description
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {jobAnalysis.insights.company_culture && (
                      <div>
                        <h4 className="font-medium mb-2">Company Culture</h4>
                        <p className="text-sm text-muted-foreground">
                          {jobAnalysis.insights.company_culture}
                        </p>
                      </div>
                    )}
                    {jobAnalysis.insights.role_focus && (
                      <div>
                        <h4 className="font-medium mb-2">Role Focus</h4>
                        <p className="text-sm text-muted-foreground">
                          {jobAnalysis.insights.role_focus}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Next: Optimize Your Resume</CardTitle>
                  <CardDescription>
                    Now that we've analyzed the job, let's see how well your resume matches and get optimization suggestions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Found {jobAnalysis.keywords?.length || 0} keywords and {jobAnalysis.requirements?.length || 0} requirements
                    </div>
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="flex items-center gap-2"
                    >
                      Optimize Resume
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
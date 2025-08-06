'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SuggestionCard } from '@/components/optimization/suggestion-card';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
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
    acceptedSuggestions,
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (!jobDescription || !resumeText) {
    return null;
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
              {/* Score Overview */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Overall Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className={`text-2xl font-bold ${getScoreColor(optimizationResults.overall_score)}`}>
                        {optimizationResults.overall_score}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Keyword Match
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className={`text-2xl font-bold ${getScoreColor(optimizationResults.keyword_match_percentage)}`}>
                        {optimizationResults.keyword_match_percentage}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-info">
                        {optimizationResults.suggestions.length}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        improvements
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Missing Keywords */}
              {optimizationResults.missing_keywords && optimizationResults.missing_keywords.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Missing Keywords</CardTitle>
                    <CardDescription>
                      Important keywords from the job description that aren't in your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {optimizationResults.missing_keywords.map((keyword, index) => (
                        <Badge key={index} variant="destructive">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Optimization Suggestions</h2>
                  <div className="text-sm text-muted-foreground">
                    {acceptedSuggestions.length} of {optimizationResults.suggestions.length} accepted
                  </div>
                </div>

                {optimizationResults.suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                  />
                ))}
              </div>

              {/* Next Step */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Optimized Resume</CardTitle>
                  <CardDescription>
                    Ready to create a professional LaTeX resume with your accepted suggestions?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {acceptedSuggestions.length > 0 
                        ? `${acceptedSuggestions.length} suggestions will be applied`
                        : 'No suggestions accepted yet'
                      }
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
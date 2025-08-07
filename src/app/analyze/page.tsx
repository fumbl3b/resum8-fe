'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    optimizationResults,
    selectedSuggestions,
    setJobAnalysis, 
    setOptimizationResults,
    toggleSuggestion,
    setSelectedSuggestions,
    setCurrentStep 
  } = useAppStore();

  const analyzeMutation = useMutation({
    mutationFn: () => apiClient.analyzeJob({ job_description: jobDescription }),
    onSuccess: (data) => {
      setJobAnalysis(data);
      // After job analysis, get optimization suggestions
      optimizeMutation.mutate();
    },
    onError: (error) => {
      console.error('Failed to analyze job:', error);
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: () => apiClient.suggestImprovements({
      resume_text: resumeText,
      job_description: jobDescription
    }),
    onSuccess: (data) => {
      // Parse the raw suggestions into structured format
      const rawSuggestions = typeof data.suggestions === 'string' ? data.suggestions : '';
      const structuredSuggestions = parseRawSuggestions(rawSuggestions);
      setOptimizationResults({
        suggestions: structuredSuggestions,
        rawSuggestions: rawSuggestions
      });
    },
    onError: (error) => {
      console.error('Failed to get optimization suggestions:', error);
    },
  });

  // Parse raw suggestions into structured format
  const parseRawSuggestions = (rawText: string) => {
    const suggestions = [];
    const lines = rawText.split('\n').filter(line => line.trim());
    
    let currentId = 1;
    for (const line of lines) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
        if (cleanLine.length > 10) { // Only include substantial suggestions
          suggestions.push({
            id: `suggestion-${currentId++}`,
            title: cleanLine.substring(0, 50) + (cleanLine.length > 50 ? '...' : ''),
            description: cleanLine,
            impact: determineImpact(cleanLine),
            category: determineCategory(cleanLine)
          });
        }
      }
    }
    
    return suggestions;
  };

  const determineImpact = (text: string): 'high' | 'medium' | 'low' => {
    const highImpactWords = ['keyword', 'ats', 'requirement', 'critical', 'essential'];
    const mediumImpactWords = ['improve', 'enhance', 'add', 'include'];
    
    const lowerText = text.toLowerCase();
    if (highImpactWords.some(word => lowerText.includes(word))) return 'high';
    if (mediumImpactWords.some(word => lowerText.includes(word))) return 'medium';
    return 'low';
  };

  const determineCategory = (text: string): 'keywords' | 'formatting' | 'content' | 'skills' => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('keyword') || lowerText.includes('ats')) return 'keywords';
    if (lowerText.includes('format') || lowerText.includes('structure')) return 'formatting';
    if (lowerText.includes('skill') || lowerText.includes('technology')) return 'skills';
    return 'content';
  };

  const handleSelectAll = () => {
    if (optimizationResults?.suggestions) {
      const allSuggestionIds = optimizationResults.suggestions.map(s => s.id);
      setSelectedSuggestions(allSuggestionIds);
    }
  };

  const handleDeselectAll = () => {
    setSelectedSuggestions([]);
  };

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


  if (!jobDescription || !resumeText) {
    return null; // Will redirect to upload
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
              Back to Upload
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Job Analysis Results
            </h1>
            <div className="w-32" />
          </div>

          {(analyzeMutation.isPending || optimizeMutation.isPending) && (
            <Card className="mb-8">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">
                    {analyzeMutation.isPending ? 'Analyzing job description...' : 'Getting optimization suggestions...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analyzeMutation.isPending 
                      ? 'Our AI is extracting keywords, requirements, and insights'
                      : 'Analyzing your resume and generating personalized suggestions'
                    }
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
                    We couldn&apos;t analyze the job description. Please try again.
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
              <div className="grid md:grid-cols-1 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Skills & Keywords</CardTitle>
                    <CardDescription>
                      Important keywords found in the job description
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{jobAnalysis.keywords}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Job Benefits</CardTitle>
                    <CardDescription>
                      Benefits and perks mentioned in the posting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{jobAnalysis.benefits}</p>
                  </CardContent>
                </Card>
              </div>

              {optimizationResults?.suggestions && (
                <Card className="mb-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Resume Optimization Suggestions</CardTitle>
                        <CardDescription>
                          Select which improvements you&apos;d like to apply to your resume
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAll}
                          disabled={!optimizationResults?.suggestions || selectedSuggestions.length === optimizationResults.suggestions.length}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={handleDeselectAll}
                          disabled={selectedSuggestions.length === 0}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {optimizationResults.suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <input
                            type="checkbox"
                            id={suggestion.id}
                            checked={selectedSuggestions.includes(suggestion.id)}
                            onChange={() => toggleSuggestion(suggestion.id)}
                            className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <label htmlFor={suggestion.id} className="cursor-pointer">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  suggestion.impact === 'high' ? 'bg-red-100 text-red-800' :
                                  suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {suggestion.impact} impact
                                </span>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {suggestion.category}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {selectedSuggestions.length === 0 && (
                      <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Select at least one suggestion to proceed with optimization
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Next: Review Your Changes</CardTitle>
                  <CardDescription>
                    {selectedSuggestions.length > 0 
                      ? `Ready to implement ${selectedSuggestions.length} selected improvement${selectedSuggestions.length === 1 ? '' : 's'}`
                      : 'Select suggestions above to proceed with optimization'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {selectedSuggestions.length > 0 
                        ? 'View changes and generate your optimized resume'
                        : 'Analysis complete - select suggestions to continue'
                      }
                    </div>
                    <Button
                      onClick={handleNext}
                      disabled={selectedSuggestions.length === 0}
                      className="flex items-center gap-2"
                    >
                      Review Changes
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
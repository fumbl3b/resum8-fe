'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, ArrowRight, Loader2, TrendingUp, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-8 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Upload
          </Button>
          
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analysis Complete
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Your Job Analysis Results</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve analyzed the job posting and your resume to provide targeted optimization suggestions
            </p>
          </div>
        </div>

        {(analyzeMutation.isPending || optimizeMutation.isPending) && (
          <Card className="mb-8">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
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
              {/* Job Analysis Results */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Job Analysis Results
                  </CardTitle>
                  <CardDescription>
                    Key requirements and insights extracted from the job posting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Required Skills & Keywords</h4>
                      <div className="text-sm text-muted-foreground">
                        {jobAnalysis.keywords}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Benefits & Perks</h4>
                      <div className="text-sm text-muted-foreground">
                        {jobAnalysis.benefits}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {optimizationResults?.suggestions && (
                <>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold">Optimization Suggestions</h2>
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
                    
                    {optimizationResults.suggestions.map((suggestion) => (
                      <Card key={suggestion.id} className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedSuggestions.includes(suggestion.id) ? 'ring-2 ring-primary' : ''
                      }`} onClick={() => toggleSuggestion(suggestion.id)}>
                        <CardContent className="pt-6">
                          <div className="flex items-start space-x-3">
                            <div className="flex items-center mt-1">
                              <input
                                type="checkbox"
                                id={suggestion.id}
                                checked={selectedSuggestions.includes(suggestion.id)}
                                onChange={() => toggleSuggestion(suggestion.id)}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="ml-3">
                                {suggestion.impact === 'high' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {suggestion.impact === 'medium' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                {suggestion.impact === 'low' && <Zap className="h-5 w-5 text-blue-500" />}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${
                                suggestion.impact === 'high' ? 'text-green-700' :
                                suggestion.impact === 'medium' ? 'text-yellow-700' :
                                'text-blue-700'
                              }`}>
                                {suggestion.impact === 'high' && 'High Impact'}
                                {suggestion.impact === 'medium' && 'Medium Impact'}
                                {suggestion.impact === 'low' && 'Enhancement'}
                              </h4>
                              <p className="text-sm font-medium mb-2">{suggestion.title}</p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {suggestion.description}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.category}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {selectedSuggestions.length === 0 && (
                      <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Select at least one suggestion to proceed with optimization
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* CTA */}
              <Card className="text-center">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedSuggestions.length > 0 
                      ? 'Ready to optimize your resume?' 
                      : 'Select suggestions to continue'
                    }
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedSuggestions.length > 0 
                      ? `Apply ${selectedSuggestions.length} selected improvement${selectedSuggestions.length === 1 ? '' : 's'} and generate your optimized resume`
                      : 'Choose which suggestions to apply to your resume above'
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={handleNext}
                      disabled={selectedSuggestions.length === 0}
                      size="lg"
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Apply Changes & Generate
                    </Button>
                    <Button variant="outline" onClick={handleBack} size="lg">
                      Back to Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
          </>
        )}
      </div>
    </div>
  );
}
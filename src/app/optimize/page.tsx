'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DiffViewer } from '@/components/ui/diff-viewer';
import { SideBySideViewer } from '@/components/ui/side-by-side-viewer';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { generateDiff, DiffResult } from '@/lib/diff-utils';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, ArrowRight, Loader2, FileText, GitCompare, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export default function OptimizePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('sideBySide');
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [optimizedResumeText, setOptimizedResumeText] = useState('');
  const [latexCode, setLatexCode] = useState('');
  
  const { 
    jobDescription,
    resumeText,
    optimizationResults,
    selectedSuggestions,
    setCurrentStep
  } = useAppStore();

  const applyMutation = useMutation({
    mutationFn: () => {
      const selectedSuggestionTexts = optimizationResults?.suggestions
        ?.filter(s => selectedSuggestions.includes(s.id))
        ?.map(s => s.description)
        ?.join('\n') || '';
      
      return apiClient.applyImprovements({
        document_text: resumeText,
        suggestions: selectedSuggestionTexts,
        document_type: 'resume',
        output_format: 'latex'
      });
    },
    onSuccess: (data) => {
      // Extract LaTeX from the markdown code block if it exists
      const latexContent = data.improved_content.includes('```latex') 
        ? data.improved_content.replace(/```latex\n?/, '').replace(/```$/, '').trim()
        : data.improved_content;
      
      setLatexCode(latexContent);
      // Generate optimized resume text from LaTeX for diff
      generateOptimizedResumeFromLatex(latexContent);
    },
    onError: (error) => {
      console.error('Failed to apply improvements:', error);
    },
  });

  // Generate optimized resume text from LaTeX
  const generateOptimizedResumeFromLatex = (latex: string) => {
    // Extract readable text from LaTeX - this is a simplified approach
    // In practice, you might want to use a proper LaTeX parser
    const optimized = latex
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1') // Remove LaTeX commands but keep content
      .replace(/\\[a-zA-Z]+/g, '') // Remove LaTeX commands without braces
      .replace(/[{}]/g, '') // Remove remaining braces
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .trim();
    
    setOptimizedResumeText(optimized);
    
    // Generate diff
    const diff = generateDiff(resumeText, optimized);
    setDiffResults(diff);
  };

  useEffect(() => {
    if (!jobDescription || !resumeText || !optimizationResults || selectedSuggestions.length === 0) {
      router.push('/analyze');
      return;
    }

    if (!latexCode && !applyMutation.isPending) {
      applyMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDescription, resumeText, optimizationResults, selectedSuggestions, latexCode]);

  const handleNext = () => {
    setCurrentStep('generate');
    router.push('/generate');
  };

  const handleBack = () => {
    setCurrentStep('analyze');
    router.push('/analyze');
  };


  if (!jobDescription || !resumeText || !optimizationResults || selectedSuggestions.length === 0) {
    return null; // Will redirect to analyze
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
              Review Changes
            </h1>
            <div className="w-40" />
          </div>

          {applyMutation.isPending && (
            <Card className="mb-8">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Applying your selected improvements...</p>
                  <p className="text-sm text-muted-foreground">
                    Generating your optimized resume with LaTeX formatting
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {applyMutation.isError && (
            <Card className="mb-8 border-destructive/50 bg-destructive/10">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-lg font-medium text-destructive mb-2">
                    Implementation Failed
                  </p>
                  <p className="text-sm text-destructive/80 mb-4">
                    We couldn&apos;t apply your improvements. Please try again.
                  </p>
                  <Button
                    onClick={() => applyMutation.mutate()}
                    variant="outline"
                  >
                    Retry Implementation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {latexCode && diffResults.length > 0 && (
            <>
              {/* Summary of selected improvements */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Applied Improvements</CardTitle>
                  <CardDescription>
                    {selectedSuggestions.length} improvement{selectedSuggestions.length === 1 ? '' : 's'} applied to your resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {optimizationResults?.suggestions
                      ?.filter(s => selectedSuggestions.includes(s.id))
                      ?.map((suggestion) => (
                        <div key={suggestion.id} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="font-medium">{suggestion.title}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            suggestion.impact === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {suggestion.impact}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              {/* Tab Navigation */}
              <TabNavigation 
                tabs={[
                  {
                    id: 'sideBySide',
                    label: 'Side by Side',
                    icon: <FileText className="w-4 h-4" />
                  },
                  {
                    id: 'unified',
                    label: 'Unified Diff',
                    icon: <GitCompare className="w-4 h-4" />
                  },
                  {
                    id: 'latex',
                    label: 'LaTeX Code',
                    icon: <Eye className="w-4 h-4" />
                  }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {/* Tab Content */}
              {activeTab === 'sideBySide' && optimizedResumeText && (
                <div className="mb-8">
                  <SideBySideViewer 
                    beforeContent={resumeText}
                    afterContent={optimizedResumeText}
                    diffResults={diffResults}
                    beforeTitle="Original Resume"
                    afterTitle="Optimized Resume"
                    isLoading={false}
                  />
                </div>
              )}

              {activeTab === 'unified' && diffResults.length > 0 && (
                <div className="mb-8">
                  <DiffViewer 
                    diffResults={diffResults} 
                    title="Resume Changes Preview"
                    isLoading={false}
                  />
                </div>
              )}

              {activeTab === 'latex' && latexCode && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Generated LaTeX Code</CardTitle>
                    <CardDescription>
                      The LaTeX code for your optimized resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono max-h-96">
                        <code>{latexCode}</code>
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => navigator.clipboard.writeText(latexCode)}
                      >
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Statistics */}
              {diffResults.length > 0 && (
                <Card className="mb-8">
                  <CardContent className="pt-6">
                    <div className="flex justify-center items-center space-x-8">
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-4 h-4 bg-green-500 rounded-sm" />
                        <span className="font-semibold">
                          {diffResults.filter(r => r.type === 'addition').length} additions
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-red-600">
                        <div className="w-4 h-4 bg-red-500 rounded-sm" />
                        <span className="font-semibold">
                          {diffResults.filter(r => r.type === 'deletion').length} deletions
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Step */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Optimized Resume is Ready!</CardTitle>
                  <CardDescription>
                    Your resume has been optimized with the selected improvements and formatted in LaTeX
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Review the changes above or start a new optimization
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push('/upload')}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        Start New
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="flex items-center gap-2"
                      >
                        Download PDF
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
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
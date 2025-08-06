'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export default function GeneratePage() {
  const router = useRouter();
  const { 
    resumeText,
    optimizationResults,
    acceptedSuggestions,
    latexResult,
    setLatexResult,
    setCurrentStep
  } = useAppStore();

  const generateMutation = useMutation({
    mutationFn: () => {
      const acceptedSuggestionsData = optimizationResults?.suggestions.filter(
        s => acceptedSuggestions.includes(s.id)
      ) || [];

      return apiClient.generateLaTeX({
        resume_text: resumeText,
        optimizations: acceptedSuggestionsData
      });
    },
    onSuccess: (data) => {
      setLatexResult(data);
    },
    onError: (error) => {
      console.error('Failed to generate LaTeX:', error);
    },
  });

  useEffect(() => {
    if (!resumeText) {
      router.push('/upload');
      return;
    }

    if (!latexResult && !generateMutation.isPending) {
      generateMutation.mutate();
    }
  }, [resumeText, latexResult, generateMutation, router]);

  const handleBack = () => {
    setCurrentStep('optimize');
    router.push('/optimize');
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    router.push('/');
  };

  const handleDownloadPDF = () => {
    if (latexResult?.pdf_url) {
      window.open(latexResult.pdf_url, '_blank');
    }
  };

  const handleDownloadLaTeX = () => {
    if (latexResult?.latex_code) {
      const blob = new Blob([latexResult.latex_code], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.tex';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (!resumeText) {
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
              Back to Optimize
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Generate Resume
            </h1>
            <div className="w-40" />
          </div>

          {generateMutation.isPending && (
            <Card className="mb-8">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Generating your resume...</p>
                  <p className="text-sm text-muted-foreground">
                    Creating LaTeX document and compiling to PDF
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {generateMutation.isError && (
            <Card className="mb-8 border-destructive/50 bg-destructive/10">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-lg font-medium text-destructive mb-2">
                    Generation Failed
                  </p>
                  <p className="text-sm text-destructive/80 mb-4">
                    We couldn't generate your resume. Please try again.
                  </p>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Generation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {latexResult && (
            <>
              {latexResult.compilation_status === 'success' ? (
                <div className="space-y-6">
                  <Card className="border-success/50 bg-success/10">
                    <CardHeader>
                      <CardTitle className="text-success flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Resume Generated Successfully!
                      </CardTitle>
                      <CardDescription>
                        Your optimized resume has been generated and is ready for download.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={handleDownloadPDF}
                          size="lg"
                          className="flex items-center gap-2"
                          disabled={!latexResult.pdf_url}
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDownloadLaTeX}
                          size="lg"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Download LaTeX Source
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => generateMutation.mutate()}
                          size="lg"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Applied Optimizations</CardTitle>
                        <CardDescription>
                          Changes that were applied to your resume
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          {acceptedSuggestions.length > 0 ? (
                            <div>
                              <p className="mb-2">
                                Applied {acceptedSuggestions.length} optimization{acceptedSuggestions.length !== 1 ? 's' : ''}:
                              </p>
                              <ul className="space-y-1">
                                {optimizationResults?.suggestions
                                  .filter(s => acceptedSuggestions.includes(s.id))
                                  .slice(0, 5)
                                  .map((suggestion, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                      {suggestion.type} in {suggestion.section}
                                    </li>
                                  ))}
                                {acceptedSuggestions.length > 5 && (
                                  <li className="text-xs">
                                    ...and {acceptedSuggestions.length - 5} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          ) : (
                            <p>No optimizations were applied. The original resume was used.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>LaTeX Preview</CardTitle>
                        <CardDescription>
                          Preview of the generated LaTeX code
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-secondary text-foreground p-4 rounded-lg text-xs overflow-x-auto">
                          <pre className="whitespace-pre-wrap">
                            {latexResult.latex_code.substring(0, 300)}
                            {latexResult.latex_code.length > 300 && '...'}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>What's Next?</CardTitle>
                      <CardDescription>
                        Your optimized resume is ready. Here are some suggestions for next steps.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Review & Customize</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Open the PDF and review all sections. Make any final adjustments to ensure accuracy.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Apply with Confidence</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your resume now includes relevant keywords and optimizations for the target job.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button
                          onClick={handleStartOver}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          Optimize Another Resume
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="border-destructive/50 bg-destructive/10">
                  <CardHeader>
                    <CardTitle className="text-destructive">Generation Error</CardTitle>
                    <CardDescription>
                      There was an issue generating your resume.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {latexResult.error_message && (
                        <div className="bg-destructive/20 p-4 rounded-lg">
                          <p className="text-sm text-destructive font-medium mb-2">Error Details:</p>
                          <p className="text-sm text-destructive/80">{latexResult.error_message}</p>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <Button
                          onClick={() => generateMutation.mutate()}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Try Again
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDownloadLaTeX}
                          className="flex items-center gap-2"
                          disabled={!latexResult.latex_code}
                        >
                          <FileText className="h-4 w-4" />
                          Download LaTeX Source
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
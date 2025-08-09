'use client';

import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DiffViewer } from '@/components/ui/diff-viewer';
import { SideBySideViewer } from '@/components/ui/side-by-side-viewer';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { generateDiff, DiffResult } from '@/lib/diff-utils';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, ArrowRight, Loader2, FileText, GitCompare, Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

function DiffContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [activeTab, setActiveTab] = useState('sideBySide');
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [optimizedResumeText, setOptimizedResumeText] = useState('');
  const [originalResumeText, setOriginalResumeText] = useState('');
  const [comparisonData, setComparisonData] = useState<{
    session_id: number;
    diff_data: {
      changes: Array<{
        type: 'modification' | 'addition' | 'deletion';
        section: string;
        line_number: number;
        before?: string;
        after?: string;
        improvement_id?: string;
      }>;
      statistics: {
        total_changes: number;
        additions: number;
        modifications: number;
        deletions: number;
      };
    };
    editable_text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    resumeText,
    setCurrentStep
  } = useAppStore();

  // Load comparison data from API
  useEffect(() => {
    const loadComparisonData = async () => {
      if (!sessionId) {
        setError('No session ID provided. Please go back and select improvements.');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // Get the comparison diff data
        const diffData = await apiClient.getComparisonDiff(parseInt(sessionId));
        setComparisonData(diffData);

        // Set the editable text as the optimized version
        setOptimizedResumeText(diffData.editable_text);
        
        // Use the app store resume text as original
        setOriginalResumeText(resumeText || '');

        // Generate diff results for the diff viewer
        const diff = generateDiff(resumeText || '', diffData.editable_text);
        setDiffResults(diff);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load comparison data.';
        setError(errorMessage);
        console.error('Comparison data error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadComparisonData();
  }, [sessionId, resumeText]);

  const handleNext = () => {
    if (sessionId) {
      router.push(`/generate?sessionId=${sessionId}`);
    } else {
      setCurrentStep('generate');
      router.push('/generate');
    }
  };

  const handleBack = () => {
    router.push('/optimize');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Unable to Load Comparison
                </h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => router.push('/optimize')}>
                  Back to Optimize
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
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
                Back to Optimize
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                Review Changes
              </h1>
              <div className="w-40" />
            </div>

            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Loading comparison...</p>
                  <p className="text-sm text-muted-foreground">
                    Generating diff and analyzing changes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
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
              Back to Optimize
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Review Changes
            </h1>
            <div className="w-40" />
          </div>

          {comparisonData && diffResults.length > 0 && (
            <>
              {/* Summary of changes */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Resume Comparison</CardTitle>
                  <CardDescription>
                    Changes applied to your resume based on optimization analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {comparisonData?.diff_data?.statistics && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {comparisonData.diff_data.statistics.additions}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">Additions</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {comparisonData.diff_data.statistics.modifications}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Modifications</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {comparisonData.diff_data.statistics.deletions}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">Deletions</div>
                      </div>
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {comparisonData.diff_data.statistics.total_changes}
                        </div>
                        <div className="text-sm text-primary">Total Changes</div>
                      </div>
                    </div>
                  )}
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
                    label: 'Resume Content',
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
                    beforeContent={originalResumeText}
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

              {activeTab === 'latex' && optimizedResumeText && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Optimized Resume Content</CardTitle>
                    <CardDescription>
                      The content of your optimized resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono max-h-96 whitespace-pre-wrap">
                        <code>{optimizedResumeText}</code>
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => navigator.clipboard.writeText(optimizedResumeText)}
                      >
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}


              {/* Next Step */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Optimized Resume is Ready!</CardTitle>
                  <CardDescription>
                    Your resume has been optimized with AI-generated improvements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Review the changes above or generate a PDF version
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push('/analyze-resume')}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        Start New Analysis
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="flex items-center gap-2"
                      >
                        Generate PDF
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

export default function DiffPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Loading comparison...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <DiffContent />
    </Suspense>
  );
}
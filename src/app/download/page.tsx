'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  Download,
  FileText,
  File,
  CheckCircle,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function DownloadPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { 
    resumeText, 
    optimizedResumeText, 
    comparisonSessionId, 
    analysisResults,
    jobDescription 
  } = useAppStore();
  
  const [finalOptimizedText, setFinalOptimizedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingText, setIsLoadingText] = useState(true);
  const [error, setError] = useState('');
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [savedArtifactId, setSavedArtifactId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load the optimized text and session status
  useEffect(() => {
    const loadDataAndStatus = async () => {
      setIsLoadingText(true);
      setError('');

      try {
        // Check if we have optimized text from the app store
        if (optimizedResumeText) {
          console.log('✅ Using optimized text from app store');
          setFinalOptimizedText(optimizedResumeText);
        }

        // Always check session status if we have a session ID
        if (comparisonSessionId) {
          console.log('📊 Checking session status:', comparisonSessionId);
          const sessionData = await apiClient.getComparisonSession(comparisonSessionId);
          console.log('📋 Session data:', sessionData);
          
          setSessionStatus(sessionData);
          setIsPdfReady(sessionData.pdf_ready || false);
          
          // Get the latest text from the session if not already available
          if (!optimizedResumeText) {
            console.log('📥 Fetching optimized text from session');
            const resumeData = await apiClient.getComparisonResumeText(comparisonSessionId);
            
            if (resumeData.improved_text) {
              setFinalOptimizedText(resumeData.improved_text);
              // Update the app store with the optimized text
              const { setOptimizedResumeText } = useAppStore.getState();
              setOptimizedResumeText(resumeData.improved_text);
            } else {
              setError('No optimized text found in the session');
            }
          }
        } else if (resumeText) {
          // Fallback to original text if no optimization was done
          console.log('⚠️ No optimization session found, using original text');
          setFinalOptimizedText(resumeText);
        } else {
          setError('No resume text available');
        }
      } catch (error) {
        console.error('❌ Error loading data and status:', error);
        setError('Failed to load resume data');
      } finally {
        setIsLoadingText(false);
      }
    };

    if (isAuthenticated) {
      loadDataAndStatus();
    }
  }, [isAuthenticated, optimizedResumeText, comparisonSessionId, resumeText]);

  // Check for saved artifacts
  useEffect(() => {
    const checkForArtifacts = async () => {
      if (!isAuthenticated || !comparisonSessionId) return;

      try {
        console.log('🔍 Checking for saved artifacts...');
        const artifacts = await apiClient.getArtifacts();
        
        // Find artifact associated with current session
        const sessionArtifact = artifacts.artifacts.find(artifact => 
          artifact.session_id === comparisonSessionId
        );
        
        if (sessionArtifact) {
          console.log('✅ Found saved artifact:', sessionArtifact.id);
          setSavedArtifactId(sessionArtifact.id);
          // If artifact has PDF, mark as ready
          if (sessionArtifact.has_pdf) {
            setIsPdfReady(true);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not check for artifacts:', error);
        // Don't set error state as this is not critical
      }
    };

    checkForArtifacts();
  }, [isAuthenticated, comparisonSessionId]);

  const handleDownloadPDF = async () => {
    if (!comparisonSessionId) {
      setError('No comparison session available for PDF download');
      return;
    }

    setIsDownloading(true);
    setError('');

    try {
      let pdfBlob: Blob;

      // Try to download from saved artifact first
      if (savedArtifactId) {
        console.log('📥 Downloading PDF from saved artifact:', savedArtifactId);
        try {
          pdfBlob = await apiClient.downloadArtifact(savedArtifactId);
          console.log('📄 PDF blob received from artifact:', pdfBlob.size, 'bytes, type:', pdfBlob.type);
        } catch (artifactError) {
          console.warn('⚠️ Artifact download failed, falling back to session download:', artifactError);
          // Fall back to session download
          pdfBlob = await apiClient.downloadComparison(comparisonSessionId);
          console.log('📄 PDF blob received from session:', pdfBlob.size, 'bytes, type:', pdfBlob.type);
        }
      } else {
        console.log('📥 Downloading PDF from session:', comparisonSessionId);
        // Use the direct session download endpoint
        pdfBlob = await apiClient.downloadComparison(comparisonSessionId);
        console.log('📄 PDF blob received from session:', pdfBlob.size, 'bytes, type:', pdfBlob.type);
      }
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized-resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('❌ PDF download failed:', error);
      setError(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If direct download fails, try regenerating PDF first
      if (error instanceof Error && error.message.includes('PDF not ready')) {
        console.log('🔄 PDF not ready, attempting to regenerate...');
        try {
          // Trigger PDF regeneration by calling generate-latex endpoint
          await apiClient.generateLatex(comparisonSessionId, {
            latex_style: 'modern',
            custom_text: finalOptimizedText
          });
          
          // Wait a moment for PDF generation to complete
          setTimeout(() => {
            setError('PDF is being generated. Please try downloading again in a moment.');
          }, 1000);
        } catch (regenError) {
          console.error('❌ PDF regeneration also failed:', regenError);
          setError('Failed to generate PDF. Please try again or download as text.');
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadText = () => {
    if (!finalOptimizedText) {
      setError('No resume text available for download');
      return;
    }

    const blob = new Blob([finalOptimizedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    router.push('/diff');
  };

  const handleStartNew = () => {
    router.push('/resume-select');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoadingText) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Review
              </Button>
              <div className="flex items-center gap-2">
                <Download className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  Download Resume
                </h1>
              </div>
              <div className="w-32" />
            </div>

            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Loading optimized resume...</p>
                  <p className="text-sm text-muted-foreground">
                    Preparing your optimized resume for download
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Review
              </Button>
              <div className="flex items-center gap-2">
                <Download className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  Download Resume
                </h1>
              </div>
              <div className="w-32" />
            </div>

            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Unable to Load Resume
                </h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleBack} variant="outline">
                    Back to Review
                  </Button>
                  <Button onClick={handleStartNew}>
                    Start New Analysis
                  </Button>
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Review
            </Button>
            <div className="flex items-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Download Resume
              </h1>
            </div>
            <div className="w-32" />
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">✓</div>
                <span className="text-sm font-medium text-foreground">Resume</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">✓</div>
                <span className="text-sm font-medium text-foreground">Job Analysis</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">✓</div>
                <span className="text-sm font-medium text-foreground">Optimize</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">✓</div>
                <span className="text-sm font-medium text-foreground">Review</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">4</div>
                <span className="text-sm font-medium text-foreground">Download</span>
              </div>
            </div>
          </div>

          {/* Resume Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Resume Preview
              </CardTitle>
              <CardDescription>
                Your optimized resume {isPdfReady ? 'PDF preview' : 'content preview'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPdfReady && comparisonSessionId ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={`/api/comparison/${comparisonSessionId}/pdf`}
                    className="w-full h-96 border-0"
                    title="Resume PDF Preview"
                  />
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg max-h-96 overflow-y-auto">
                  {isGenerating ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-lg font-medium">Generating PDF preview...</p>
                        <p className="text-sm text-muted-foreground">
                          This may take a few moments
                        </p>
                      </div>
                    </div>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap text-foreground">
                      {finalOptimizedText}
                    </pre>
                  )}
                </div>
              )}
              <div className="mt-4 text-sm text-muted-foreground">
                {isPdfReady && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    PDF is ready for download
                  </div>
                )}
                {!isPdfReady && (
                  <span>
                    {finalOptimizedText.length} characters • {finalOptimizedText.split('\n').length} lines
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Download as PDF
                </CardTitle>
                <CardDescription>
                  Professional formatted PDF ready for applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleDownloadPDF}
                  disabled={isDownloading || !comparisonSessionId}
                  className="w-full flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {savedArtifactId ? 'Download PDF (Saved)' : isPdfReady ? 'Download PDF (Ready)' : 'Download PDF'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="w-5 h-5 text-blue-600" />
                  Download as Text
                </CardTitle>
                <CardDescription>
                  Plain text format for easy editing and customization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleDownloadText}
                  disabled={!finalOptimizedText}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Text
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load the optimized text
  useEffect(() => {
    const loadOptimizedText = async () => {
      setIsLoadingText(true);
      setError('');

      try {
        // Check if we have optimized text from the app store
        if (optimizedResumeText) {
          console.log('✅ Using optimized text from app store');
          setFinalOptimizedText(optimizedResumeText);
          setIsLoadingText(false);
          return;
        }

        // If no optimized text but we have a session, fetch it
        if (comparisonSessionId) {
          console.log('📥 Fetching optimized text from session:', comparisonSessionId);
          const resumeData = await apiClient.getComparisonResumeText(comparisonSessionId);
          console.log('📄 Received resume data:', resumeData);
          
          if (resumeData.improved_text) {
            setFinalOptimizedText(resumeData.improved_text);
            // Update the app store with the optimized text
            const { setOptimizedResumeText } = useAppStore.getState();
            setOptimizedResumeText(resumeData.improved_text);
          } else {
            setError('No optimized text found in the session');
          }
        } else if (resumeText) {
          // Fallback to original text if no optimization was done
          console.log('⚠️ No optimization session found, using original text');
          setFinalOptimizedText(resumeText);
        } else {
          setError('No resume text available');
        }
      } catch (error) {
        console.error('❌ Error loading optimized text:', error);
        setError('Failed to load optimized resume text');
      } finally {
        setIsLoadingText(false);
      }
    };

    if (isAuthenticated) {
      loadOptimizedText();
    }
  }, [isAuthenticated, optimizedResumeText, comparisonSessionId, resumeText]);

  const handleDownloadPDF = async () => {
    if (!finalOptimizedText) {
      setError('No resume text available for PDF generation');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      console.log('🔧 Generating PDF from optimized text...');
      
      // First generate LaTeX from the optimized text
      if (comparisonSessionId) {
        const latexResult = await apiClient.generateLatex(comparisonSessionId, {
          latex_style: 'modern',
          custom_text: finalOptimizedText
        });

        console.log('✅ LaTeX generated, converting to PDF...');
        
        // Convert LaTeX to PDF
        const pdfResult = await apiClient.convertToLatex(latexResult.latex_content, 'modern');
        
        console.log('✅ PDF result received:', pdfResult);
        
        // Check if we got base64 data (which is what the API actually returns)
        if (pdfResult.pdf_content) {
          console.log('📄 PDF content received as base64, decoding...');
          
          // Handle base64 PDF content
          const binaryString = atob(pdfResult.pdf_content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'application/pdf' });
          console.log('📄 PDF blob created from base64:', blob.size, 'bytes');
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'optimized-resume.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
        } else if (pdfResult.pdf_url) {
          console.log('📥 Downloading PDF from URL:', pdfResult.pdf_url);
          
          // Try to fetch the PDF from the URL (fallback)
          const response = await fetch(pdfResult.pdf_url);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          console.log('📄 PDF blob received:', blob.size, 'bytes, type:', blob.type);
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'optimized-resume.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
        } else {
          console.error('❌ Unexpected PDF result format:', pdfResult);
          throw new Error('Unexpected response format from PDF conversion');
        }
        
      } else {
        // Fallback: create a simple text-based PDF
        console.log('⚠️ No session ID, creating simple text download');
        const blob = new Blob([finalOptimizedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'optimized-resume.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      setError(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
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
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">5</div>
                <span className="text-sm font-medium text-foreground">Download</span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <Card className="mb-8">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Resume Optimization Complete!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your resume has been successfully optimized for the target job. Choose your preferred download format below.
              </p>
              {jobDescription && (
                <div className="text-sm text-muted-foreground">
                  Optimized for: <span className="font-medium text-foreground">{jobDescription.substring(0, 100)}...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Resume Preview
              </CardTitle>
              <CardDescription>
                Preview your optimized resume before downloading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap text-foreground">
                  {finalOptimizedText}
                </pre>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {finalOptimizedText.length} characters • {finalOptimizedText.split('\n').length} lines
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
                  disabled={isGenerating || !finalOptimizedText}
                  className="w-full flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
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

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                Your resume is ready! Here are some suggestions for your job application process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mt-1">1</div>
                  <div>
                    <p className="font-medium text-foreground">Review and Customize</p>
                    <p className="text-sm text-muted-foreground">Make any final adjustments to match your personal style and preferences.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mt-1">2</div>
                  <div>
                    <p className="font-medium text-foreground">Tailor for Each Application</p>
                    <p className="text-sm text-muted-foreground">Consider creating variations for different types of positions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mt-1">3</div>
                  <div>
                    <p className="font-medium text-foreground">Track Your Applications</p>
                    <p className="text-sm text-muted-foreground">Keep records of where you've applied and follow up appropriately.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <Button onClick={handleStartNew} variant="outline">
                  Optimize Another Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
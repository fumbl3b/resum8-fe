'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { 
  ArrowLeft, 
  Download,
  FileText,
  File,
  CheckCircle,
  Eye
} from 'lucide-react';

export default function DownloadPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { resumeText, analysisResults } = useAppStore();
  const [optimizedText, setOptimizedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!resumeText || !analysisResults) {
      router.push('/resume-select');
      return;
    }

    // Generate optimized resume text
    // In a real implementation, this would call the API to apply improvements
    const mockOptimizedText = `${resumeText}

[OPTIMIZED SECTIONS WOULD APPEAR HERE]

This is where the optimized resume content would be displayed after applying the selected improvements from the analysis.`;
    
    setOptimizedText(mockOptimizedText);
  }, [resumeText, analysisResults, router]);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // In a real implementation, this would call the API to generate PDF
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      
      // Create a mock PDF download
      const blob = new Blob([optimizedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized-resume.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([optimizedText], { type: 'text/plain' });
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
                  {optimizedText}
                </pre>
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
                  disabled={isGenerating}
                  className="w-full flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
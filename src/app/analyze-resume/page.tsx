'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { ResumeUploader } from '@/components/forms/resume-uploader';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Star,
  BarChart3,
  Zap
} from 'lucide-react';

interface AnalysisScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'good' | 'fair' | 'poor';
  feedback: string;
}

export default function AnalyzeResumePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { resumeText, resumeFile, resumeId, setCurrentStep } = useAppStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisScores, setAnalysisScores] = useState<AnalysisScore[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);


  const handleAnalyze = async () => {
    const { resumeId } = useAppStore.getState();
    if (!resumeId) {
      setError('No resume uploaded. Please upload a resume first.');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      // Start the analysis
      const startResponse = await apiClient.analyzeResume({
        resume_id: resumeId,
        analysis_type: 'comprehensive'
      });
      
      // Poll for results
      const pollForResults = async (analysisId: number) => {
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts with 2-second intervals = 1 minute max
        
        while (attempts < maxAttempts) {
          try {
            const result = await apiClient.getResumeAnalysis(analysisId);
            
            if (result.status === 'DONE') {
              if (result.results) {
                // Convert API results to our UI format for compatibility
                const convertedScores = convertAnalysisResults(result.results);
                setAnalysisScores(convertedScores);
                setAnalysisComplete(true);
                
                // Extract text if available in results
                if (result.results.resume_text) {
                  setResumeText(result.results.resume_text);
                }
              }
              break;
            } else if (result.status === 'ERROR') {
              throw new Error('Analysis failed on server');
            }
            
            // Wait 2 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
          } catch (pollError) {
            console.error('Error polling analysis results:', pollError);
            throw pollError;
          }
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Analysis timed out. Please try again.');
        }
      };
      
      await pollForResults(startResponse.analysis_id);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = () => {
    setCurrentStep('optimize');
    router.push('/optimize');
  };

  const getScoreColor = (status: 'good' | 'fair' | 'poor') => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
    }
  };

  const getScoreIcon = (status: 'good' | 'fair' | 'poor') => {
    switch (status) {
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'fair': return <Target className="w-4 h-4" />;
      case 'poor': return <TrendingDown className="w-4 h-4" />;
    }
  };

  // Convert API analysis results to our UI format
  const convertAnalysisResults = (results: {
    overall_score: number;
    ats_score: number;
    strengths: Array<{ category: string; impact: string; description: string }>;
    weaknesses: Array<{ category: string; impact: string; description: string; suggestion: string }>;
    resume_text?: string;
  }): AnalysisScore[] => {
    const scores: AnalysisScore[] = [];
    
    // Use overall and ATS scores from API
    scores.push({
      category: 'Overall Quality',
      score: Math.round(results.overall_score * 10), // Convert 7.5 to 75
      maxScore: 100,
      status: results.overall_score >= 8 ? 'good' : results.overall_score >= 6 ? 'fair' : 'poor',
      feedback: `Overall resume quality based on comprehensive analysis.`
    });

    scores.push({
      category: 'ATS Compatibility',
      score: Math.round(results.ats_score * 10), // Convert 6.8 to 68
      maxScore: 100,
      status: results.ats_score >= 8 ? 'good' : results.ats_score >= 6 ? 'fair' : 'poor',
      feedback: `Applicant Tracking System compatibility score.`
    });

    // Convert strengths to scores
    results.strengths.forEach((strength) => {
      scores.push({
        category: strength.category,
        score: strength.impact === 'high' ? 85 : strength.impact === 'medium' ? 75 : 65,
        maxScore: 100,
        status: 'good',
        feedback: strength.description
      });
    });

    // Convert weaknesses to scores
    results.weaknesses.forEach((weakness) => {
      scores.push({
        category: weakness.category,
        score: weakness.impact === 'high' ? 40 : weakness.impact === 'medium' ? 55 : 70,
        maxScore: 100,
        status: weakness.impact === 'high' ? 'poor' : 'fair',
        feedback: `${weakness.description} Suggestion: ${weakness.suggestion}`
      });
    });

    return scores;
  };

  const overallScore = analysisScores.length > 0 
    ? Math.round(analysisScores.reduce((sum, score) => sum + score.score, 0) / analysisScores.length)
    : 0;

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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Analyze Resume
              </h1>
            </div>
            <div className="w-32" />
          </div>

          {!resumeId || !analysisComplete ? (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Resume</CardTitle>
                  <CardDescription>
                    Upload your resume to get detailed analysis of strengths, weaknesses, and optimization recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <ResumeUploader />
                    
                    {resumeId && !analysisComplete && (
                      <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-900 dark:text-green-100">
                              Resume uploaded successfully!
                            </span>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-200">
                            Ready to analyze your resume for strengths and areas for improvement.
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2"
                          >
                            {isAnalyzing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Analyzing Resume...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="h-4 w-4" />
                                Start Analysis
                              </>
                            )}
                          </Button>
                        </div>

                        {error && (
                          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-red-900 dark:text-red-100">
                                Analysis Failed
                              </span>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-200">
                              {error}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Resume Preview */}
              <div className="lg:col-span-1">
                <Card className="h-fit sticky top-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Resume Preview
                    </CardTitle>
                    <CardDescription>
                      Your uploaded resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                      {resumeText ? (
                        <div className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                          {resumeText}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>Resume content will appear here after analysis</p>
                          <p className="text-xs mt-2">The text will be extracted during the analysis process</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      {resumeFile?.name} • {(resumeFile?.size || 0) / 1024 / 1024 > 0 ? 
                        `${((resumeFile?.size || 0) / 1024 / 1024).toFixed(2)} MB` : 
                        `${((resumeFile?.size || 0) / 1024).toFixed(0)} KB`}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Analysis Results */}
              <div className="lg:col-span-2 space-y-6">
                {/* Overall Score Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      Overall Resume Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl font-bold text-primary">
                        {overallScore}/100
                      </div>
                      <Badge variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}>
                        {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 mb-4">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${overallScore}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your resume shows strong potential with several areas for improvement to maximize your job search success.
                    </p>
                  </CardContent>
                </Card>

                {/* Detailed Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Analysis</CardTitle>
                    <CardDescription>
                      Breakdown of your resume&apos;s performance across key categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {analysisScores.map((analysis, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={getScoreColor(analysis.status)}>
                                {getScoreIcon(analysis.status)}
                              </div>
                              <span className="font-medium">{analysis.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${getScoreColor(analysis.status)}`}>
                                {analysis.score}/{analysis.maxScore}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-1000 ${
                                analysis.status === 'good' ? 'bg-green-500' :
                                analysis.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${(analysis.score / analysis.maxScore) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {analysis.feedback}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {analysisScores.filter(s => s.status === 'good').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Strong Areas</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {analysisScores.filter(s => s.status === 'fair').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Areas to Improve</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {analysisScores.filter(s => s.status === 'poor').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Critical Issues</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Button */}
                <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <Zap className="w-6 h-6 text-primary" />
                        <h3 className="text-xl font-bold">Ready to Optimize?</h3>
                      </div>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Get personalized recommendations to improve your resume and increase your chances of getting interviews.
                      </p>
                      <Button 
                        onClick={handleOptimize}
                        size="lg"
                        className="flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Optimize Resume
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
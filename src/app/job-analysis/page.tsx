'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  ArrowRight, 
  Briefcase,
  Loader2,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3
} from 'lucide-react';

export default function JobAnalysisPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { resumeId, setJobDescription, setJobAnalysis, setAnalysisResults, setComparisonSessionId, setResumeText, jobAnalysis } = useAppStore();
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [analysisResults, setLocalAnalysisResults] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!resumeId && isAuthenticated) {
      router.push('/resume-select');
    }
  }, [resumeId, isAuthenticated, router]);

  const jobAnalysisMutation = useMutation({
    mutationFn: (jobDescription: string) => apiClient.analyzeJob({ job_description: jobDescription }),
    onSuccess: (data) => {
      setError(''); // Clear any previous errors
      setJobDescription(jobDescriptionText.trim());
      setJobAnalysis(data);
      setShowJobDetails(true);
      startComparison();
    },
    onError: (error) => {
      console.error('Job analysis failed:', error);
      setError('Failed to analyze job description. Please try again.');
    },
  });

  const comparisonMutation = useMutation({
    mutationFn: () => apiClient.startComparison({
      base_resume_id: resumeId!,
      job_description: jobDescriptionText.trim(),
      job_title: 'Target Position'
    }),
    onSuccess: (data) => {
      console.log('🚀 Comparison started:', data);
      setError(''); // Clear any previous errors
      const sessionId = data.session_id || data.id;
      
      console.log('📋 Session ID extracted:', sessionId);
      
      // Store the session ID for use in other components
      if (sessionId) {
        setComparisonSessionId(sessionId);
      } else {
        console.error('❌ No session ID found in response');
        setError('Failed to get session ID from comparison start');
        return;
      }
      
      // If status is already DONE (synchronous processing), get results immediately
      if (data.status === 'DONE') {
        console.log('✅ Comparison completed synchronously');
        // Fetch the session data immediately
        apiClient.getComparisonSession(sessionId)
          .then(sessionData => {
            console.log('🔍 Session data received immediately:', sessionData);
            processComparisonResults(sessionData);
          })
          .catch(error => {
            console.error('❌ Error fetching session data:', error);
            setError('Failed to fetch comparison results');
          });
      } else {
        // Fall back to polling for backward compatibility
        console.log('⏳ Starting polling for async processing');
        pollForResults(sessionId);
      }
    },
    onError: (error) => {
      console.error('Comparison failed:', error);
      setError('Failed to start comparison analysis. Please try again.');
    },
  });

  const startComparison = () => {
    if (resumeId && jobDescriptionText.trim()) {
      comparisonMutation.mutate();
    }
  };

  // Extract results processing into a separate function
  const processComparisonResults = (sessionData: any) => {
    // Type for improvement items
    type ImprovementItem = {
      category: string;
      description: string;
      improved_text?: string;
    };
    console.log('🔍 Session completed, received data:', sessionData);
    console.log('🔍 Raw suggestions:', sessionData.suggestions);
    console.log('🔍 Analysis results:', sessionData.analysis_results);
    
    // Ensure session ID is set from the session data
    if (sessionData.id && !useAppStore.getState().comparisonSessionId) {
      console.log('📋 Setting session ID from session data:', sessionData.id);
      setComparisonSessionId(sessionData.id);
    }
    
    // Store the resume text from the session data if available
    // The comparison API should include the original resume text for diff purposes
    if (sessionData.original_resume_text) {
      console.log('📝 Storing original resume text from session data');
      setResumeText(sessionData.original_resume_text);
    } else if (sessionData.resume_text) {
      console.log('📝 Storing resume text from session data');
      setResumeText(sessionData.resume_text);
    }
    
    // Parse the suggestions string to extract improvements
    let parsedSuggestions = [];
    let weaknesses = [];
    
    try {
      // Check for improvements in the session data first (new format)
      if (sessionData.improvements) {
        console.log('📋 Found improvements in session data:', sessionData.improvements);
        const improvements = sessionData.improvements;
        
        // Convert improvements to weaknesses format, preserving original IDs
        if (improvements.high_impact) {
          weaknesses.push(...improvements.high_impact.map((imp: any) => ({
            id: imp.id, // Preserve the original improvement ID from backend
            category: imp.category,
            impact: 'high' as const,
            description: imp.description,
            suggestion: imp.improved_text || imp.description
          })));
        }
        
        if (improvements.medium_impact) {
          weaknesses.push(...improvements.medium_impact.map((imp: any) => ({
            id: imp.id, // Preserve the original improvement ID from backend
            category: imp.category,
            impact: 'medium' as const,
            description: imp.description,
            suggestion: imp.improved_text || imp.description
          })));
        }
        
        if (improvements.low_impact) {
          weaknesses.push(...improvements.low_impact.map((imp: any) => ({
            id: imp.id, // Preserve the original improvement ID from backend
            category: imp.category,
            impact: 'low' as const,
            description: imp.description,
            suggestion: imp.improved_text || imp.description
          })));
        }
        
        console.log('✅ Converted improvements to weaknesses format:', weaknesses.length, 'items');
      } else if (sessionData.suggestions) {
        // Fallback to parsing suggestions if improvements not available
        if (sessionData.suggestions.startsWith('{') || sessionData.suggestions.startsWith('[')) {
          parsedSuggestions = JSON.parse(sessionData.suggestions);
          console.log('📋 Parsed suggestions JSON:', parsedSuggestions);
        } else {
          // If suggestions are plain text, create structured data from them
          const suggestionLines = sessionData.suggestions.split('\n').filter((line: string) => line.trim());
          parsedSuggestions = suggestionLines.map((line: string, index: number) => ({
            id: `suggestion-${index}`,
            description: line.trim(),
            category: 'Content Improvement',
            impact: index < 3 ? 'high' : index < 6 ? 'medium' : 'low'
          }));
          console.log('📋 Generated suggestions from text:', parsedSuggestions);
        }
        
        // Convert suggestions to weaknesses format
        if (Array.isArray(parsedSuggestions)) {
          weaknesses = parsedSuggestions.map((suggestion, index) => ({
            category: suggestion.category || suggestion.title || 'Resume Improvement',
            impact: suggestion.impact || (index < 3 ? 'high' : index < 6 ? 'medium' : 'low'),
            description: suggestion.description || suggestion.text || suggestion,
            suggestion: suggestion.improved_text || suggestion.recommendation || suggestion.description || suggestion
          }));
        } else if (parsedSuggestions.high_impact || parsedSuggestions.medium_impact || parsedSuggestions.low_impact) {
          // Handle the old format if it's still being returned
          weaknesses = [
            ...(parsedSuggestions.high_impact || []).map((imp: any) => ({
              category: imp.category,
              impact: 'high' as const,
              description: imp.description,
              suggestion: imp.improved_text || imp.description
            })),
            ...(parsedSuggestions.medium_impact || []).map((imp: any) => ({
              category: imp.category,
              impact: 'medium' as const,
              description: imp.description,
              suggestion: imp.improved_text || imp.description
            })),
            ...(parsedSuggestions.low_impact || []).map((imp: any) => ({
              category: imp.category,
              impact: 'low' as const,
              description: imp.description,
              suggestion: imp.improved_text || imp.description
            }))
          ];
        }
      }
    } catch (error) {
      console.error('❌ Error parsing suggestions:', error);
      console.log('📝 Using raw suggestions as fallback');
      
      // Fallback: create basic improvements from raw text
      if (sessionData.suggestions) {
        const lines = sessionData.suggestions.split('\n').filter((line: string) => line.trim());
        weaknesses = lines.slice(0, 10).map((line: string, index: number) => ({
          category: 'Content Improvement',
          impact: index < 3 ? 'high' as const : index < 6 ? 'medium' as const : 'low' as const,
          description: line.trim(),
          suggestion: line.trim()
        }));
      }
    }
    
    // Convert comparison results to analysis format
    const analysisData = {
      overall_score: 7.5,
      ats_score: 6.8,
      strengths: [],
      weaknesses: weaknesses
    };
    
    console.log('✅ Generated analysis data:', analysisData);
    console.log('✅ Total weaknesses generated:', analysisData.weaknesses.length);
    
    setLocalAnalysisResults(analysisData);
    setAnalysisResults(analysisData);
    setShowAnalysis(true);
    
    // Force a re-render to update navigation buttons
    setTimeout(() => {
      console.log('🔄 Forcing re-render to update navigation buttons');
    }, 100);
  };

  const pollForResults = async (sessionId: number) => {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const sessionData = await apiClient.getComparisonSession(sessionId);

        if (sessionData.status === 'DONE') {
          processComparisonResults(sessionData);
          break;
        } else if (sessionData.status === 'ERROR') {
          throw new Error('Analysis failed on server');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.error('Error polling analysis:', error);
        break;
      }
    }

    if (attempts >= maxAttempts) {
      console.error('Analysis timed out');
    }
  };

  const handleAnalyze = () => {
    if (!jobDescriptionText.trim()) return;
    jobAnalysisMutation.mutate(jobDescriptionText.trim());
  };

  const handleOptimize = () => {
    console.log('🚀 Attempting to navigate to optimize page...');
    
    // Check if we have the essential data for optimization
    if (!analysisResults || !analysisResults.weaknesses || analysisResults.weaknesses.length === 0) {
      setError('Analysis not complete. Please wait for the analysis to finish.');
      return;
    }
    
    // Check if mutations are still pending
    if (jobAnalysisMutation.isPending || comparisonMutation.isPending) {
      setError('Analysis is still in progress. Please wait for it to complete.');
      return;
    }
    
    // Validate we have all necessary data before proceeding
    const { validateFlowState } = useAppStore.getState();
    const validation = validateFlowState();
    
    if (!validation.valid) {
      console.warn('⚠️ Flow validation failed:', validation.message);
      console.log('🔍 Attempting to proceed anyway with available data...');
      
      // Check if we have the minimum required data to proceed
      const hasMinimumData = resumeId && jobDescriptionText.trim() && analysisResults;
      
      if (!hasMinimumData) {
        setError(`Cannot proceed: ${validation.message}`);
        return;
      }
      
      console.log('✅ Proceeding with minimum required data despite flow validation warning');
    }
    
    console.log('✅ All validation passed, proceeding to optimize');
    console.log('📊 Current state:', {
      resumeId,
      jobDescription: jobDescriptionText,
      analysisResults: !!analysisResults,
      weaknessesCount: analysisResults?.weaknesses?.length || 0,
      sessionId: useAppStore.getState().comparisonSessionId
    });
    
    router.push('/optimize');
  };

  // Check if we have the minimum data needed to proceed
  const canProceedToOptimize = () => {
    const canProceed = (
      showAnalysis && 
      analysisResults && 
      analysisResults.weaknesses && 
      analysisResults.weaknesses.length > 0 &&
      !isAnalyzing &&
      !jobAnalysisMutation.isPending &&
      !comparisonMutation.isPending
    );
    
    // Debug logging
    if (showAnalysis && analysisResults) {
      console.log('🔍 Navigation state check:', {
        showAnalysis,
        hasAnalysisResults: !!analysisResults,
        hasWeaknesses: !!(analysisResults?.weaknesses),
        weaknessesCount: analysisResults?.weaknesses?.length || 0,
        isAnalyzing,
        jobAnalysisPending: jobAnalysisMutation.isPending,
        comparisonPending: comparisonMutation.isPending,
        canProceed
      });
    }
    
    return canProceed;
  };

  const isAnalyzing = jobAnalysisMutation.isPending || comparisonMutation.isPending;

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
              onClick={() => router.push('/resume-select')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Resume Selection
            </Button>
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Job Analysis
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  canProceedToOptimize() 
                    ? 'bg-green-500 text-white' 
                    : isAnalyzing 
                      ? 'bg-primary text-white' 
                      : 'bg-primary text-white'
                }`}>
                  {canProceedToOptimize() ? '✓' : isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : '2'}
                </div>
                <span className="text-sm font-medium text-foreground">Job Analysis</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">3</div>
                <span className="text-sm font-medium text-muted-foreground">Optimize</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">4</div>
                <span className="text-sm font-medium text-muted-foreground">Review</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">5</div>
                <span className="text-sm font-medium text-muted-foreground">Download</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Analysis Error
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setError('')}
                      className="mt-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Two-column layout during analysis */}
          <div className={`grid ${isAnalyzing ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-8 mb-8`}>
            {/* Left column - Job Description Input (always visible) */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                  <CardDescription>
                    Paste the job description you want to optimize your resume for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Textarea
                    placeholder="Paste the complete job description here...

Example:
We are looking for a Senior Software Engineer to join our team...
• 5+ years of experience in full-stack development
• Proficiency in React, Node.js, and TypeScript
• Experience with cloud platforms (AWS, Azure, or GCP)
• Strong problem-solving skills and ability to work in a team environment"
                    value={jobDescriptionText}
                    onChange={(e) => setJobDescriptionText(e.target.value)}
                    className="min-h-[300px] resize-none"
                  />
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{jobDescriptionText.length} characters</span>
                    <span>Minimum 100 characters recommended</span>
                  </div>

                  {!showAnalysis && (
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAnalyze}
                        disabled={jobDescriptionText.trim().length < 50 || isAnalyzing}
                        className="flex items-center gap-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing Match...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4" />
                            Analyze Job Match
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Analyzing Your Resume...
                      </h3>
                      <p className="text-muted-foreground">
                        AI is comparing your resume against the job requirements to identify optimization opportunities.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column - Analysis Results (appears during and after analysis) */}
            {(isAnalyzing || showJobDetails || showAnalysis) && (
              <div className="space-y-6">
                {/* Job Details */}
                {showJobDetails && jobAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        Job Requirements Analysis
                      </CardTitle>
                      <CardDescription>
                        Key information extracted from the job description
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Keywords */}
                        {jobAnalysis.keywords && jobAnalysis.keywords.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-foreground mb-3">Key Keywords</h3>
                            <div className="flex flex-wrap gap-2">
                              {jobAnalysis.keywords.map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Required Skills */}
                        {jobAnalysis.required_skills && jobAnalysis.required_skills.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-foreground mb-3">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {jobAnalysis.required_skills.map((skill, index) => (
                                <Badge key={index} variant="default" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Preferred Skills */}
                        {jobAnalysis.preferred_skills && jobAnalysis.preferred_skills.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-foreground mb-3">Preferred Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {jobAnalysis.preferred_skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Benefits */}
                        {jobAnalysis.benefits && jobAnalysis.benefits.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-foreground mb-3">Benefits & Perks</h3>
                            <ul className="space-y-1">
                              {jobAnalysis.benefits.map((benefit, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Company Culture */}
                        {jobAnalysis.company_culture && jobAnalysis.company_culture.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-foreground mb-3">Company Culture</h3>
                            <ul className="space-y-1">
                              {jobAnalysis.company_culture.map((culture, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Target className="w-3 h-3 text-blue-500" />
                                  {culture}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Difficulty Level & Match Score */}
                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          {jobAnalysis.difficulty_level && (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Difficulty Level</p>
                              <p className="text-lg font-semibold text-foreground">{jobAnalysis.difficulty_level}</p>
                            </div>
                          )}
                          {jobAnalysis.match_score !== null && (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Initial Match Score</p>
                              <p className="text-lg font-semibold text-primary">{jobAnalysis.match_score.toFixed(1)}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Analysis Results */}
                {showAnalysis && analysisResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Resume Analysis Results
                      </CardTitle>
                      <CardDescription>
                        Here's how your resume matches the job requirements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Card className="p-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-2">{analysisResults.overall_score.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">Overall Match</div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">{analysisResults.ats_score.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">ATS Score</div>
                          </div>
                        </Card>
                      </div>

                      {analysisResults.weaknesses && analysisResults.weaknesses.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Areas for Improvement:</h3>
                          <div className="space-y-2">
                            {analysisResults.weaknesses.slice(0, 3).map((weakness: any, index: number) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                  <p className="font-medium text-red-900 dark:text-red-100">{weakness.category}</p>
                                  <p className="text-sm text-red-700 dark:text-red-200">{weakness.description}</p>
                                </div>
                              </div>
                            ))}
                            {analysisResults.weaknesses.length > 3 && (
                              <p className="text-sm text-muted-foreground">
                                And {analysisResults.weaknesses.length - 3} more improvements available...
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col items-center mt-6 space-y-4">
                        {/* Show loading state during analysis */}
                        {isAnalyzing && (
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 w-full max-w-md">
                            <Loader2 className="w-6 h-6 text-blue-600 mx-auto mb-2 animate-spin" />
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              {comparisonMutation.isPending ? 'Analyzing resume compatibility...' : 'Processing job description...'}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              This may take up to 30 seconds
                            </p>
                          </div>
                        )}
                        
                        {/* Show success state when analysis is complete */}
                        {!isAnalyzing && showAnalysis && analysisResults && analysisResults.weaknesses && analysisResults.weaknesses.length > 0 && (
                          <>
                            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 w-full max-w-md">
                              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Analysis Complete!
                              </p>
                              <div className="text-xs text-green-600 dark:text-green-300 space-y-1">
                                <p>✓ {analysisResults.weaknesses.length} improvement opportunities identified</p>
                                <p>✓ Resume compatibility analysis done</p>
                                <p>✓ Session data saved for optimization</p>
                              </div>
                            </div>
                            <Button 
                              onClick={handleOptimize} 
                              size="lg"
                              className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                            >
                              Continue to Optimization
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {/* Show waiting state if analysis exists but no button should be shown yet */}
                        {!isAnalyzing && showAnalysis && (!analysisResults || !analysisResults.weaknesses || analysisResults.weaknesses.length === 0) && (
                          <Button 
                            onClick={handleOptimize} 
                            disabled
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            Processing Results...
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </Button>
                        )}
                        
                        {/* Show disabled state if no analysis has started */}
                        {!isAnalyzing && !showAnalysis && (
                          <Button 
                            onClick={handleOptimize} 
                            disabled
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            Start Analysis First
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
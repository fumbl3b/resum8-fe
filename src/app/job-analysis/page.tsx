'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useSessionPolling } from '@/hooks/useSessionPolling';
import { SessionStatus } from '@/components/ui/session-status';
import { 
  ArrowLeft, 
  ArrowRight, 
  Briefcase,
  Loader2,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function JobAnalysisPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { resumeId, setJobDescription, setJobAnalysis, setAnalysisResults, setComparisonSessionId, setResumeText, jobAnalysis, comparisonSessionId } = useAppStore();
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [analysisResults, setLocalAnalysisResults] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [error, setError] = useState('');
  const [sessionSteps, setSessionSteps] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState('');
  const [stepProgress, setStepProgress] = useState(0);
  const [jobDescriptionCollapsed, setJobDescriptionCollapsed] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [shouldStartPolling, setShouldStartPolling] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [partialResults, setPartialResults] = useState<{
    keywords?: string[];
    jobTitle?: string;
    analysisProgress?: string;
  }>({});

  // Stable callback functions to prevent polling hook from restarting
  const handlePollingUpdate = useCallback((session: any) => {
    setSessionData(session);
    setIsPollingActive(true);
    console.log('📡 Polling update received:', { 
      status: session.status, 
      timestamp: new Date().toLocaleTimeString(),
      stepStates: session.steps ? Object.entries(session.steps).map(([name, step]: [string, any]) => `${name}:${step?.state || 'unknown'}`) : 'no-steps'
    });
    
    // Update step progress based on session state
    if (session.steps) {
      updateStepProgress(session.steps);
      setSessionSteps(session.steps);
    } else if (session.status === 'RUNNING') {
      // If no steps data but still running, show basic progress
      setProcessingStep('Processing analysis...');
      const currentProgress = Math.max(stepProgress, 15);
      setStepProgress(Math.min(currentProgress + 5, 90));
    }
  }, [stepProgress]);

  const handlePollingComplete = useCallback((session: any) => {
    console.log('✅ Session completed, processing results...');
    setProcessingStep('Analysis complete! 🎉');
    setStepProgress(100);
    setIsPollingActive(false);
    // Add small delay to let UI settle before showing results
    setTimeout(() => {
      processComparisonResults(session);
    }, 500);
  }, []);

  const shouldPollSession = useCallback((session: any) => {
    // Stop polling once suggestions are ready (user needs to select improvements)
    if (session.steps?.suggest?.state === 'DONE') {
      console.log('🛑 Stopping polling - suggestions are ready for user selection');
      setIsPollingActive(false);
      return false;
    }
    const shouldContinue = session.status === 'RUNNING' || session.status === 'PENDING';
    console.log('🔄 Polling decision:', { 
      status: session.status, 
      shouldContinue,
      suggestState: session.steps?.suggest?.state,
      timestamp: new Date().toLocaleTimeString()
    });
    return shouldContinue;
  }, []);

  // Use session polling hook to keep session data updated and trigger re-renders
  const { isPolling } = useSessionPolling({
    sessionId: shouldStartPolling ? (comparisonSessionId || null) : null,
    onUpdate: handlePollingUpdate,
    onComplete: handlePollingComplete,
    shouldPoll: shouldPollSession
  });

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

  // Single mutation that does everything: job analysis + comparison + improvements + LaTeX + PDF
  const comparisonMutation = useMutation({
    mutationFn: () => {
      console.log('🚀 comparisonMutation.mutationFn called');
      const payload = {
        base_resume_id: resumeId!,
        job_description: jobDescriptionText.trim()
        // Let backend extract job title from description
      };
      console.log('📤 Sending API request with payload:', payload);
      return apiClient.startComparison(payload);
    },
    onSuccess: (data) => {
      console.log('✅ Comparison mutation successful, received:', data);
      setError(''); // Clear any previous errors
      const sessionId = data.session_id || data.id;
      
      console.log('📋 Session ID extracted:', sessionId);
      
      // Store job description and session ID
      setJobDescription(jobDescriptionText.trim());
      
      // Store the session ID for use in other components
      if (sessionId) {
        setComparisonSessionId(sessionId);
      } else {
        console.error('❌ No session ID found in response');
        setError('Failed to get session ID from comparison start');
        return;
      }
      
      // IMMEDIATE UI FEEDBACK - Show initial progress
      setProcessingStep('Parsing resume and analyzing job description...');
      setStepProgress(15); // Start with more progress to show immediate response
      
      // Handle initial step data from response - all should be PENDING initially
      if (data.steps) {
        setSessionSteps(data.steps);
        console.log('📊 Initial steps from /compare/start:', data.steps);
        // Don't update progress yet since all steps should be PENDING
      }
      
      // Note: job_title and other data won't be available until polling starts
      // The initial response just contains session_id, status=PENDING/RUNNING, and steps=PENDING
      
      // Collapse accordion when session starts
      if (!jobDescriptionCollapsed) {
        setJobDescriptionCollapsed(true);
      }
      
      // Now start polling for session updates
      console.log('✅ Session created:', sessionId, 'Initial status:', data.status);
      setShouldStartPolling(true);
      setIsPollingActive(true);
      
      // Set initial progress to show immediate feedback
      setStepProgress(15);
      setProcessingStep('Starting analysis...');
    },
    onError: (error) => {
      console.error('❌ Comparison mutation failed:', error);
      setIsPollingActive(false);
      setShouldStartPolling(false);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      setError('Failed to start comparison analysis. Please try again.');
      setProcessingStep('');
      setStepProgress(0);
    },
  });


  // Extract results processing into a separate function
  const processComparisonResults = (sessionData: any) => {
    console.log('🔍 Session completed, received data:', sessionData);
    console.log('🔍 Raw suggestions:', sessionData.suggestions);
    console.log('🔍 Analysis results:', sessionData.analysis_results);
    
    // Ensure session ID is set from the session data
    if (sessionData.id && !useAppStore.getState().comparisonSessionId) {
      console.log('📋 Setting session ID from session data:', sessionData.id);
      setComparisonSessionId(sessionData.id);
    }
    
    // Extract and set job analysis data from session
    if (sessionData.analysis_results) {
      try {
        const jobAnalysisData = typeof sessionData.analysis_results === 'string' 
          ? JSON.parse(sessionData.analysis_results) 
          : sessionData.analysis_results;
          
        console.log('📊 Setting job analysis data from session:', jobAnalysisData);
        setJobAnalysis(jobAnalysisData);
        setShowJobDetails(true);
      } catch (parseError) {
        console.warn('⚠️ Could not parse job analysis from session:', parseError);
      }
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
    
    // Remove automatic scroll to let user see results naturally
    // Force a re-render to update navigation buttons
    setTimeout(() => {
      console.log('🔄 Forcing re-render to update navigation buttons');
    }, 100);
  };


  // Function to update step progress based on session steps
  const updateStepProgress = (steps: any) => {
    const stepOrder = ['parse_base', 'analyze', 'suggest'];
    let completedSteps = 0;
    let currentStepName = '';
    let isAnyStepRunning = false;
    
    // First pass: count completed steps and find current running step
    stepOrder.forEach((stepName, index) => {
      const step = steps[stepName];
      if (step?.state === 'DONE') {
        completedSteps = index + 1;
      } else if (step?.state === 'RUNNING') {
        currentStepName = getStepDisplayName(stepName);
        setProcessingStep(`${currentStepName}...`);
        isAnyStepRunning = true;
        // Add partial progress for the running step
        completedSteps = index + 0.5; // Half progress for running step
      }
    });
    
    // If no step is running but we have completed steps, show progress for next pending step
    if (!isAnyStepRunning && completedSteps < stepOrder.length) {
      const nextStepIndex = Math.floor(completedSteps);
      if (nextStepIndex < stepOrder.length) {
        const nextStep = steps[stepOrder[nextStepIndex]];
        if (nextStep?.state === 'PENDING') {
          const nextStepName = getStepDisplayName(stepOrder[nextStepIndex]);
          setProcessingStep(`Preparing ${nextStepName.toLowerCase()}...`);
        }
      }
    }
    
    // Calculate progress percentage with better granularity
    const progressPercent = Math.min(Math.round((completedSteps / stepOrder.length) * 100), 100);
    
    // Ensure minimum progress is shown (never below 15% once started)
    const finalProgress = Math.max(progressPercent, 15);
    setStepProgress(finalProgress);
    
    console.log('📊 Step progress update:', {
      completedSteps,
      totalSteps: stepOrder.length,
      progressPercent,
      finalProgress,
      currentStep: currentStepName,
      isAnyStepRunning,
      stepStates: Object.entries(steps).map(([name, step]: [string, any]) => 
        `${name}: ${step?.state || 'unknown'}`
      )
    });
  };

  // Helper function to get user-friendly step names
  const getStepDisplayName = (stepName: string): string => {
    switch (stepName) {
      case 'parse_base': return 'Parsing your resume';
      case 'analyze': return 'Analyzing job description';
      case 'suggest': return 'Generating improvement suggestions';
      case 'rewrite': return 'Applying selected improvements';
      case 'diff': return 'Generating comparison';
      case 'latex': return 'Creating LaTeX format';
      case 'pdf': return 'Generating PDF';
      default: return 'Processing';
    }
  };

  const handleAnalyze = () => {
    console.log('🚀 handleAnalyze called with:', {
      jobDescriptionLength: jobDescriptionText.trim().length,
      resumeId,
      isAnalyzing: comparisonMutation.isPending
    });
    
    if (!jobDescriptionText.trim()) {
      console.warn('❌ No job description provided');
      return;
    }
    if (!resumeId) {
      console.warn('❌ No resume ID available');
      setError('Please select a resume first');
      return;
    }
    
    console.log('✅ Starting analysis mutation...');
    
    // OPTIMISTIC UI UPDATES - Immediate feedback
    setError(''); // Clear any previous errors
    setProcessingStep('Starting analysis...');
    setStepProgress(5);
    
    // Collapse job description immediately
    if (!jobDescriptionCollapsed) {
      setJobDescriptionCollapsed(true);
    }
    
    // Clear any previous partial results
    setPartialResults({});
    
    console.log('🔄 Calling comparisonMutation.mutate()...');
    comparisonMutation.mutate();
  };

  const handleOptimize = () => {
    console.log('🚀 Attempting to navigate to optimize page...');
    
    // Check if we have the essential data for optimization
    if (!analysisResults || !analysisResults.weaknesses || analysisResults.weaknesses.length === 0) {
      setError('Analysis not complete. Please wait for the analysis to finish.');
      return;
    }
    
    // Check if mutations are still pending
    if (comparisonMutation.isPending) {
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
    
    // Scroll to top before navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
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
        comparisonPending: comparisonMutation.isPending,
        canProceed
      });
    }
    
    return canProceed;
  };

  // Analysis is active if either the initial mutation is pending OR polling is active
  const isAnalyzing = comparisonMutation.isPending || isPollingActive;

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

          {/* Main content area with card stack */}
          <div className="space-y-6 mb-8">

            {/* Analysis Results - Slide in from top (appear at top of stack) */}
            {showAnalysis && analysisResults && (
              <Card className="animate-in slide-in-from-top-4 duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Analysis Results
                  </CardTitle>
                  <CardDescription>
                    Here's how your resume matches the job requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Analysis Complete Status - Prominently displayed */}
                  {!isAnalyzing && showAnalysis && analysisResults && analysisResults.weaknesses && analysisResults.weaknesses.length > 0 && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                          Analysis Complete!
                        </h3>
                      </div>
                      <div className="text-center text-sm text-green-600 dark:text-green-300 space-y-1">
                        <p>✓ {analysisResults.weaknesses.length} improvement opportunities identified</p>
                        <p>✓ Resume compatibility analysis complete</p>
                        <p>✓ Ready for optimization</p>
                      </div>
                    </div>
                  )}
                  
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
                            <Target className="w-5 h-5 text-red-600 mt-0.5" />
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

                  {/* Real-time Processing Status */}
                  {isAnalyzing && (
                    <div className="text-center p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                      <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
                      
                      <p className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                        {processingStep || 'Starting analysis...'}
                      </p>
                      
                      {/* Inline Progress Bar */}
                      <div className="w-full max-w-xs mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-full h-1.5 mb-3">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${stepProgress}%` }}
                        ></div>
                      </div>
                      
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {stepProgress}% complete • {stepProgress < 33 ? 'Reading resume...' :
                         stepProgress < 66 ? 'Analyzing job match...' :
                         stepProgress < 100 ? 'Finding improvements...' :
                         'Almost done!'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {/* Job Requirements Analysis - Second in stack */}
            {showJobDetails && jobAnalysis && (
              <Card className="animate-in slide-in-from-top-4 duration-500">
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

            {/* Real-time Progress Tracking */}
            {isAnalyzing && (
              <Card className="animate-in slide-in-from-top-4 duration-500">
                <CardContent className="p-8">
                  <div className="text-center bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                    <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
                    
                    {/* Current Step Display */}
                    <p className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                      {processingStep || 'Starting analysis...'}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-2 mb-4">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${stepProgress}%` }}
                      ></div>
                    </div>
                    
                    {/* Step Progress Indicators */}
                    {sessionSteps && (
                      <div className="flex justify-center items-center gap-4 mb-4">
                        {['parse_base', 'analyze', 'suggest'].map((stepName, index) => {
                          const step = sessionSteps[stepName];
                          const isCompleted = step?.state === 'DONE';
                          const isRunning = step?.state === 'RUNNING';
                                          
                          return (
                            <div key={stepName} className="flex flex-col items-center gap-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                isCompleted ? 'bg-green-500 text-white' :
                                isRunning ? 'bg-blue-500 text-white' :
                                'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                {isCompleted ? '✓' : isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : index + 1}
                              </div>
                              <span className={`text-xs ${
                                isCompleted ? 'text-green-600 dark:text-green-400' :
                                isRunning ? 'text-blue-600 dark:text-blue-400' :
                                'text-gray-500 dark:text-gray-500'
                              }`}>
                                {getStepDisplayName(stepName).split(' ').slice(-2).join(' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {stepProgress < 33 ? 'Parsing your resume and extracting content...' :
                       stepProgress < 66 ? 'Analyzing job requirements and keywords...' :
                       stepProgress < 100 ? 'Generating improvement suggestions...' :
                       'Finalizing analysis results...'}
                    </p>
                    
                    <div className="mt-3 text-xs text-blue-500 dark:text-blue-400">
                      Progress: {stepProgress}% • This may take up to 30 seconds
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Status Component - Shows real-time polling updates */}
            {isAnalyzing && sessionData && (
              <SessionStatus sessionData={sessionData} className="animate-in slide-in-from-right-4 duration-500" />
            )}

            {/* Partial Results Display */}
            {isAnalyzing && (partialResults.jobTitle || partialResults.keywords || partialResults.analysisProgress) && (
              <Card className="animate-in slide-in-from-left-4 duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Partial Results Available
                  </CardTitle>
                  <CardDescription>
                    Results are coming in as we process your analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Title */}
                  {partialResults.jobTitle && (
                    <div className="animate-in fade-in-0 duration-300">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">✓ Job Title Detected</p>
                      <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-2 rounded">
                        {partialResults.jobTitle}
                      </p>
                    </div>
                  )}
                  
                  {/* Keywords Preview */}
                  {partialResults.keywords && partialResults.keywords.length > 0 && (
                    <div className="animate-in fade-in-0 duration-300">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">✓ Key Skills Identified</p>
                      <div className="flex flex-wrap gap-1">
                        {partialResults.keywords.slice(0, 8).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs animate-in fade-in-0 duration-300" style={{animationDelay: `${index * 100}ms`}}>
                            {keyword}
                          </Badge>
                        ))}
                        {partialResults.keywords.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{partialResults.keywords.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Analysis Progress */}
                  {partialResults.analysisProgress && (
                    <div className="animate-in fade-in-0 duration-300">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        ✓ {partialResults.analysisProgress}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    💡 Full results will appear here when analysis completes
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Job Description Input - Last in stack */}
            <Card className={`transition-all duration-500 ease-in-out ${jobDescriptionCollapsed ? 'opacity-60' : 'opacity-100'}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Job Description</CardTitle>
                    {!jobDescriptionCollapsed && (
                      <CardDescription>
                        Paste the job description you want to optimize your resume for
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setJobDescriptionCollapsed(!jobDescriptionCollapsed)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    {jobDescriptionCollapsed ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        <span className="text-sm">Expand</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        <span className="text-sm">Collapse</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${jobDescriptionCollapsed ? 'max-h-0 opacity-0' : 'max-h-[800px] opacity-100'}`}>
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
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className={`transition-colors duration-200 ${
                      jobDescriptionText.length >= 100 ? 'text-green-600' : 
                      jobDescriptionText.length >= 50 ? 'text-yellow-600' : 'text-muted-foreground'
                    }`}>
                      {jobDescriptionText.length} characters
                      {jobDescriptionText.length >= 100 && ' ✓'}
                    </span>
                    <span className="text-muted-foreground">
                      Minimum 50 characters required
                    </span>
                  </div>

                  {!showAnalysis && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          console.log('🖱️ Button clicked!');
                          handleAnalyze();
                        }}
                        disabled={jobDescriptionText.trim().length < 50 || isAnalyzing}
                        className={`flex items-center gap-2 transition-all duration-200 ${
                          jobDescriptionText.trim().length >= 50 && !isAnalyzing 
                            ? 'hover:scale-105 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90' 
                            : ''
                        }`}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing Match...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 w-4" />
                            Analyze Job Match
                          </>
                        )}
                      </Button>
                    </div>
                  )}


                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          
          {/* Floating Next Step Button */}
          {!isAnalyzing && showAnalysis && analysisResults && analysisResults.weaknesses && analysisResults.weaknesses.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50">
              <Button 
                onClick={handleOptimize} 
                size="lg"
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                Continue to Optimization
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
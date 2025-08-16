'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSessionPolling } from '@/hooks/useSessionPolling';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { DiffViewer } from '@/components/ui/diff-viewer';
import { SideBySideViewer } from '@/components/ui/side-by-side-viewer';
import { TabNavigation } from '@/components/ui/tab-navigation';
// Note: Using native select instead of UI library select component
import { generateDiff, DiffResult } from '@/lib/diff-utils';

// Clean up text content for better readability in diff view
const cleanTextForDiff = (text: string): string => {
  if (!text) return '';
  
  // If text appears to have LaTeX commands despite API spec, clean them up
  if (text.includes('\\') && (text.includes('{') || text.includes('}'))) {
    console.log('⚠️ Detected potential LaTeX in text, cleaning for diff view...');
    return text
      // Remove common LaTeX commands while preserving content
      .replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1') // \command{content} -> content
      .replace(/\\[a-zA-Z]+\*?/g, '') // Remove standalone commands
      .replace(/\\\\/g, '\n') // Convert LaTeX line breaks to newlines
      .replace(/[{}]/g, '') // Remove remaining braces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  return text;
};
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, ArrowRight, Loader2, FileText, GitCompare, Eye, Edit, Download, Save, CheckCircle, Briefcase, Archive } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { SessionStatus } from '@/components/ui/session-status';

function DiffContent() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('preview');
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [localOptimizedResumeText, setLocalOptimizedResumeText] = useState('');
  const [editedResumeText, setEditedResumeText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [latexStyle, setLatexStyle] = useState<'modern' | 'classic' | 'minimal'>('modern');
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState('');
  const [originalResumeText, setOriginalResumeText] = useState('');
  const [showImprovementsApplying, setShowImprovementsApplying] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedArtifactId, setSavedArtifactId] = useState<number | null>(null);
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
  const [isLoading, setIsLoading] = useState(true); // Start with loading, will be set to false quickly if we have store data
  const [error, setError] = useState('');
  const hasInitialized = useRef(false);
  
  const { 
    resumeText,
    optimizedResumeText,
    resumeId,
    comparisonSessionId,
    analysisResults,
    selectedSuggestions,
    setCurrentStep
  } = useAppStore();

  // Validate session on component mount
  useEffect(() => {
    const validateSession = async () => {
      if (!comparisonSessionId) {
        console.error('❌ No comparison session ID found');
        setError('No active session found. Please start from the job analysis step.');
        return;
      }
      
      try {
        const sessionValidation = await apiClient.validateComparisonSession(comparisonSessionId);
        if (!sessionValidation.valid) {
          console.error('❌ Session validation failed:', sessionValidation);
          setError(`Session is no longer valid: ${sessionValidation.message}. Please restart from job analysis.`);
          return;
        }
        console.log('✅ Session validation passed:', sessionValidation.status);
      } catch (validationError) {
        console.error('❌ Session validation error:', validationError);
        setError('Unable to validate session. Please restart from job analysis.');
        return;
      }
    };
    
    validateSession();
  }, [comparisonSessionId]);

  // Show improvements applying message when coming from optimize page
  useEffect(() => {
    if (selectedSuggestions.length > 0) {
      setShowImprovementsApplying(true);
      // Hide the message after 3 seconds
      const timer = setTimeout(() => {
        setShowImprovementsApplying(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedSuggestions]);

  // Stable callback functions to prevent polling hook from restarting
  const handleSessionUpdate = useCallback(async (session: any) => {
    setSessionData(session);
    console.log('🔄 Session status update:', {
      status: session.status,
      pdf_ready: session.pdf_ready,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Update PDF ready status
    if (session.pdf_ready && !pdfReady) {
      setPdfReady(true);
      console.log('📄 PDF is now ready!');
      
      // Try to get PDF URL if we don't have it yet
      if (!pdfUrl && comparisonSessionId) {
        try {
          const pdfBlob = await apiClient.downloadComparison(comparisonSessionId);
          const url = URL.createObjectURL(pdfBlob);
          setPdfUrl(url);
          console.log('📄 PDF URL created for preview');
        } catch (pdfError) {
          console.warn('⚠️ Could not get PDF for preview:', pdfError);
        }
      }
    }
  }, [pdfReady, pdfUrl, comparisonSessionId]);

  const shouldPollSession = useCallback((session: any) => {
    // Stop polling when PDF is ready and session is complete
    const shouldContinue = !session.pdf_ready || session.status !== 'DONE';
    console.log('🔄 Diff polling decision:', {
      pdf_ready: session.pdf_ready,
      status: session.status,
      shouldContinue,
      timestamp: new Date().toLocaleTimeString()
    });
    return shouldContinue;
  }, []);

  // Use session polling hook to keep session data updated
  useSessionPolling({
    sessionId: comparisonSessionId || null,
    onUpdate: handleSessionUpdate,
    shouldPoll: shouldPollSession
  });

  // Fetch comparison diff data
  useEffect(() => {
    const fetchComparisonData = async (backgroundUpdate = false) => {
      console.log('🔍 Diff page state check:', {
        resumeText: !!resumeText,
        optimizedResumeText: !!optimizedResumeText,
        resumeId,
        comparisonSessionId,
        resumeTextLength: resumeText?.length || 0,
        optimizedTextLength: optimizedResumeText?.length || 0,
        backgroundUpdate
      });

      // Check if we already have the optimized text from the store
      if (resumeText && optimizedResumeText) {
        console.log('✅ Using optimized text from app store');
        console.log('📝 Store original text preview:', resumeText.substring(0, 200) + '...');
        console.log('📝 Store improved text preview:', optimizedResumeText.substring(0, 200) + '...');
        console.log('📊 Store text lengths:', {
          original: resumeText.length,
          improved: optimizedResumeText.length
        });
        
        // Clean text for better diff viewing
        const cleanOriginal = cleanTextForDiff(resumeText);
        const cleanImproved = cleanTextForDiff(optimizedResumeText);
        
        setOriginalResumeText(cleanOriginal);
        setLocalOptimizedResumeText(cleanImproved);
        
        // Generate diff results using cleaned text
        const diff = generateDiff(cleanOriginal, cleanImproved);
        setDiffResults(diff);
        
        // Create mock comparison data
        setComparisonData({
          session_id: comparisonSessionId || 0,
          diff_data: {
            changes: diff.map((d, index) => ({
              type: d.type === 'deletion' ? 'deletion' as const : d.type === 'addition' ? 'addition' as const : 'modification' as const,
              section: `Section ${index + 1}`,
              line_number: d.lineNumber.before ?? d.lineNumber.after ?? index + 1,
              before: d.type === 'deletion' ? d.content : undefined,
              after: d.type === 'addition' ? d.content : undefined,
            })),
            statistics: {
              total_changes: diff.length,
              additions: diff.filter(d => d.type === 'addition').length,
              modifications: diff.filter(d => d.type === 'unchanged').length,
              deletions: diff.filter(d => d.type === 'deletion').length,
            }
          },
          editable_text: optimizedResumeText
        });
        
        // Only set loading false if this is not a background update
        if (!backgroundUpdate) {
          setIsLoading(false);
        }
        return;
      }

      if (!comparisonSessionId) {
        setError('No comparison session found. Please go back and complete the job analysis process.');
        return;
      }

      // Validate that we have the minimum required data
      if (!resumeId && !resumeText) {
        setError('No resume data found. Please go back and select a resume.');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        console.log('📥 Fetching session data for:', comparisonSessionId);
        
        // First, try to get session data which should now include improved_text directly
        // Note: This might duplicate the polling call, but we need this for initial load
        console.log('📥 Making initial session data call (separate from polling)');
        const sessionData = await apiClient.getComparisonSession(comparisonSessionId);
        console.log('📄 Received session data:', sessionData);
        
        // Check if we have improved_text in the session
        if (sessionData.improved_text) {
          console.log('✅ Using improved_text from session data');
          
          // Get original text from app store or session data
          let originalText = resumeText || '';
          
          // The session should contain all the data we need
          if (!originalText && sessionData.original_resume_text) {
            originalText = sessionData.original_resume_text;
            console.log('📝 Using original_resume_text from session');
          } else if (!originalText && (sessionData as any).resume_text) {
            originalText = (sessionData as any).resume_text;
            console.log('📝 Using resume_text from session');
          }
          
          // Use data from session
          const cleanOriginal = cleanTextForDiff(originalText);
          const cleanImproved = cleanTextForDiff(sessionData.improved_text);
          
          setOriginalResumeText(cleanOriginal);
          setLocalOptimizedResumeText(cleanImproved);
          setEditedResumeText(cleanImproved);
          
          // Generate client-side diff
          const diff = generateDiff(cleanOriginal, cleanImproved);
          setDiffResults(diff);
          
          // Create comparison data structure
          setComparisonData({
            session_id: sessionData.id,
            diff_data: {
              changes: diff.map((d, index) => ({
                type: d.type === 'deletion' ? 'deletion' as const : d.type === 'addition' ? 'addition' as const : 'modification' as const,
                section: `Section ${index + 1}`,
                line_number: d.lineNumber.before ?? d.lineNumber.after ?? index + 1,
                before: d.type === 'deletion' ? d.content : undefined,
                after: d.type === 'addition' ? d.content : undefined,
              })),
              statistics: {
                total_changes: diff.length,
                additions: diff.filter(d => d.type === 'addition').length,
                modifications: diff.filter(d => d.type === 'unchanged').length,
                deletions: diff.filter(d => d.type === 'deletion').length,
              }
            },
            editable_text: sessionData.improved_text
          });
          
          // Update PDF status from session
          if (sessionData.pdf_ready) {
            setPdfReady(true);
          }
          
          // Content is ready to display immediately
          setIsLoading(false);
          
        } else {
          console.log('ℹ️ No improved_text found - user has not applied improvements yet');
          
          // In the new flow, this is expected until user selects and applies improvements
          // Show the original text and redirect back to optimization
          const originalText = resumeText || sessionData.original_resume_text || (sessionData as any).resume_text || '';
          
          if (!originalText) {
            throw new Error('No original resume text available');
          }
          
          // Show original text only until improvements are applied
          setOriginalResumeText(cleanTextForDiff(originalText));
          setLocalOptimizedResumeText(''); // No improved text yet
          setEditedResumeText('');
          
          // Create minimal comparison data
          setComparisonData({
            session_id: sessionData.id,
            diff_data: {
              changes: [],
              statistics: {
                total_changes: 0,
                additions: 0,
                modifications: 0,
                deletions: 0,
              }
            },
            editable_text: ''
          });
          
          // Set an error message to guide the user back
          setError('No improvements have been applied yet. Please go back to select and apply improvements first.');
          
          // Still show the UI so user can see original text
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('❌ Error fetching resume text:', error);
        
        // Fallback: try the old diff endpoint
        try {
          console.log('🔄 Trying fallback diff endpoint...');
          const diffData = await apiClient.getComparisonDiff(comparisonSessionId);
          console.log('📄 Received diff data:', diffData);
          
          const originalText = diffData.editable_text.split('\n\n--- OPTIMIZED VERSION ---\n\n')[0] || 'Original resume text';
          
          setComparisonData(diffData);
          setOriginalResumeText(originalText);
          setLocalOptimizedResumeText(diffData.editable_text);
          
          // Generate client-side diff for visualization
          const diff = generateDiff(originalText, diffData.editable_text);
          setDiffResults(diff);
          
        } catch (fallbackError) {
          console.error('❌ Fallback diff endpoint also failed:', fallbackError);
          
          // Final fallback: try to create a basic diff from analysis results
          if (resumeText && analysisResults?.weaknesses && analysisResults.weaknesses.length > 0) {
            console.log('🔄 Using final fallback: generating diff from analysis results');
            
            setOriginalResumeText(resumeText);
            
            // Create a simple optimized version with suggestions applied
            let optimizedText = resumeText;
            const appliedSuggestions = analysisResults.weaknesses
              .filter((_, index) => selectedSuggestions.includes(`improvement-${index + 1}`))
              .map(weakness => weakness.suggestion)
              .join('\n\n');
            
            if (appliedSuggestions) {
              optimizedText += '\n\n--- APPLIED IMPROVEMENTS ---\n\n' + appliedSuggestions;
            }
            
            setLocalOptimizedResumeText(optimizedText);
            
            // Generate diff results
            const diff = generateDiff(resumeText, optimizedText);
            setDiffResults(diff);
            
            // Create mock comparison data
            setComparisonData({
              session_id: comparisonSessionId,
              diff_data: {
                changes: diff.map((d, index) => ({
                  type: d.type === 'deletion' ? 'deletion' as const : d.type === 'addition' ? 'addition' as const : 'modification' as const,
                  section: `Section ${index + 1}`,
                  line_number: d.lineNumber.before ?? d.lineNumber.after ?? index + 1,
                  before: d.type === 'deletion' ? d.content : undefined,
                  after: d.type === 'addition' ? d.content : undefined,
                })),
                statistics: {
                  total_changes: diff.length,
                  additions: diff.filter(d => d.type === 'addition').length,
                  modifications: diff.filter(d => d.type === 'unchanged').length,
                  deletions: diff.filter(d => d.type === 'deletion').length,
                }
              },
              editable_text: optimizedText
            });
          } else {
            setError('Unable to load comparison data. Please go back and complete the optimization process.');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only run once on mount or when critical data changes
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      if (resumeText && optimizedResumeText) {
        // Fast path - show UI immediately with store data
        setIsLoading(false); // Show UI immediately
        fetchComparisonData(true); // Background update to enhance data
      } else {
        // Slow path - show loading screen while fetching
        fetchComparisonData(false); // Initial load
      }
    }
  }, [comparisonSessionId]); // Only re-run when session ID changes, not on every state update

  // Sync edited text with optimized text when it changes
  useEffect(() => {
    if (localOptimizedResumeText && !editedResumeText) {
      setEditedResumeText(localOptimizedResumeText);
    }
  }, [localOptimizedResumeText, editedResumeText]);

  // Debug current state
  useEffect(() => {
    console.log('🔍 Diff page state updated:', {
      hasComparisonData: !!comparisonData,
      hasDiffResults: diffResults.length > 0,
      hasLocalOptimizedText: !!localOptimizedResumeText,
      hasOriginalText: !!originalResumeText,
      hasEditedText: !!editedResumeText,
      isEditing,
      isLoading
    });
  }, [comparisonData, diffResults, localOptimizedResumeText, originalResumeText, editedResumeText, isEditing, isLoading]);

  const handleNext = () => {
    router.push('/download');
  };

  const handleExport = () => {
    router.push('/download');
  };

  const handleBack = () => {
    router.push('/optimize');
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      // Save the edited text to the backend
      if (comparisonSessionId && editedResumeText !== localOptimizedResumeText) {
        try {
          console.log('💾 Saving edited text to session:', comparisonSessionId);
          await apiClient.editComparisonText(comparisonSessionId, editedResumeText);
          console.log('✅ Text saved and PDF regenerated');
        } catch (error) {
          console.error('❌ Error saving edited text:', error);
          setError('Failed to save changes. Please try again.');
          return; // Don't exit edit mode if save failed
        }
      }
      
      // Update local state
      setLocalOptimizedResumeText(editedResumeText);
      
      // Update the app store with the edited text
      const { setOptimizedResumeText } = useAppStore.getState();
      setOptimizedResumeText(editedResumeText);
      
      console.log('📝 Saved edited resume text:', editedResumeText.length, 'characters');
    }
    setIsEditing(!isEditing);
  };

  const handleGenerateLatex = async () => {
    if (!comparisonSessionId) {
      setError('No comparison session found. Please complete the optimization process first.');
      return;
    }

    setIsGeneratingLatex(true);
    setError('');

    try {
      console.log('🔧 Generating LaTeX with style:', latexStyle);
      console.log('📝 Using custom text:', !!editedResumeText);
      
      const result = await apiClient.generateLatex(comparisonSessionId, {
        latex_style: latexStyle,
        custom_text: editedResumeText || localOptimizedResumeText
      });

      console.log('✅ LaTeX generated successfully:', {
        textSource: result.text_source,
        latexLength: result.latex_content.length
      });

      setGeneratedLatex(result.latex_content);
      
      // Switch to the LaTeX tab to show the result
      setActiveTab('latex');
      
    } catch (error) {
      console.error('❌ Error generating LaTeX:', error);
      setError(`Failed to generate LaTeX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingLatex(false);
    }
  };

  const handleSaveArtifact = async () => {
    if (!comparisonSessionId) {
      setError('No comparison session found. Please complete the optimization process first.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      console.log('💾 Saving artifact for session:', comparisonSessionId);
      
      // Create a title based on job description or session data
      const jobDescription = useAppStore.getState().jobDescription;
      const timestamp = new Date().toLocaleDateString();
      const defaultTitle = `Resume - ${timestamp}`;
      
      const result = await apiClient.saveArtifact(comparisonSessionId, {
        title: defaultTitle
      });

      console.log('✅ Artifact saved successfully:', result);
      setSavedArtifactId(result.artifact_id);
      
    } catch (error) {
      console.error('❌ Error saving artifact:', error);
      setError(`Failed to save resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
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

            <div className="grid gap-6">
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
              
              {sessionData && (
                <SessionStatus sessionData={sessionData} />
              )}
            </div>
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
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">3</div>
                <span className="text-sm font-medium text-foreground">Review</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">4</div>
                <span className="text-sm font-medium text-muted-foreground">Download</span>
              </div>
            </div>
          </div>

          {/* Improvements Applying Message */}
          {showImprovementsApplying && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Applying improvements to your resume...
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Your selected improvements are being integrated into the resume text.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(comparisonData || (diffResults.length > 0 && localOptimizedResumeText)) && (
            <>
              {/* Two-column layout: Metrics left, Resume viewer right */}
              <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Left Column - Metrics */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Changes Summary</CardTitle>
                      <CardDescription>
                        AI-applied improvements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {comparisonData?.diff_data?.statistics?.additions || diffResults.filter(d => d.type === 'addition').length}
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">Additions</div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {comparisonData?.diff_data?.statistics?.modifications || 0}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">Modifications</div>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div className="text-2xl font-bold text-red-600 mb-1">
                            {comparisonData?.diff_data?.statistics?.deletions || diffResults.filter(d => d.type === 'deletion').length}
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">Deletions</div>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg border">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {comparisonData?.diff_data?.statistics?.total_changes || diffResults.length}
                          </div>
                          <div className="text-sm text-primary font-medium">Total Changes</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Resume Viewer */}
                <div className="lg:col-span-2">

                  {/* Tab Navigation */}
                  <TabNavigation 
                    tabs={[
                      {
                        id: 'preview',
                        label: 'Preview',
                        icon: <Eye className="w-4 h-4" />
                      },
                      {
                        id: 'compare',
                        label: 'Compare',
                        icon: <GitCompare className="w-4 h-4" />
                      }
                    ]}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />

              {/* Tab Content */}
              {activeTab === 'compare' && localOptimizedResumeText && (
                <div className="mb-8">
                  <SideBySideViewer 
                    beforeContent={originalResumeText}
                    afterContent={localOptimizedResumeText}
                    diffResults={diffResults}
                    beforeTitle="Original Resume"
                    afterTitle="Optimized Resume"
                    isLoading={false}
                  />
                </div>
              )}

              {activeTab === 'preview' && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Resume Preview</span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleEditToggle}
                          variant={isEditing ? "default" : "outline"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                          {isEditing ? 'Save Changes' : 'Edit'}
                        </Button>
                        <Button
                          onClick={handleExport}
                          className="flex items-center gap-2"
                          disabled={!pdfReady}
                        >
                          <Download className="w-4 h-4" />
                          {pdfReady ? 'Export' : 'Preparing Export...'}
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {isEditing 
                        ? 'Make your final edits to the resume text. Click "Save Changes" when done.'
                        : 'Your optimized resume text.'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Non-blocking PDF generation status */}
                    {!pdfReady && !isEditing && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            Preparing PDF export in background...
                          </p>
                        </div>
                      </div>
                    )}

                    {isEditing ? (
                      <Textarea
                        value={editedResumeText}
                        onChange={(e) => setEditedResumeText(e.target.value)}
                        className="min-h-[400px] font-mono text-sm resize-y"
                        placeholder="Edit your resume text here..."
                      />
                    ) : (
                      <div className="bg-muted p-4 rounded-lg border min-h-[400px] overflow-auto">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {editedResumeText || localOptimizedResumeText}
                        </div>
                      </div>
                    )}
                    
                    {!isEditing && (
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(editedResumeText || localOptimizedResumeText)}
                        >
                          Copy Text
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {(editedResumeText || localOptimizedResumeText).length} characters
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
                </div>
              </div>

              {/* Bottom Action Card */}
              <Card className="mt-8">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      {!savedArtifactId && (
                        <Button 
                          onClick={handleSaveArtifact}
                          disabled={isSaving}
                          className="flex items-center gap-2"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Archive className="w-4 h-4" />
                              Save Resume
                            </>
                          )}
                        </Button>
                      )}
                      {savedArtifactId && (
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-md">
                          <CheckCircle className="w-4 h-4" />
                          Resume saved to library
                        </div>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/job-analysis')}
                        className="flex items-center gap-2"
                      >
                        <Briefcase className="w-4 h-4" />
                        Optimize for another job
                      </Button>
                      <Button 
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Return Home
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating "Optimized resume is ready" component */}
              {!showImprovementsApplying && (comparisonData || diffResults.length > 0) && (
                <div className="fixed bottom-6 right-6 z-50">
                  <Card className="shadow-lg border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 animate-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Optimized Resume is Ready!
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-300">
                            Your improvements have been applied
                          </p>
                        </div>
                        <Button 
                          onClick={handleExport}
                          size="sm"
                          className="ml-2 bg-green-600 hover:bg-green-700"
                          disabled={!pdfReady}
                        >
                          {pdfReady ? (
                            <>
                              Export
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Preparing...
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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
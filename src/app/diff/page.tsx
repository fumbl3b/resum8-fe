'use client';

import { Suspense, useEffect, useState } from 'react';
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
import { ArrowLeft, ArrowRight, Loader2, FileText, GitCompare, Eye, Edit, Download, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

function DiffContent() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('sideBySide');
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [localOptimizedResumeText, setLocalOptimizedResumeText] = useState('');
  const [editedResumeText, setEditedResumeText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [latexStyle, setLatexStyle] = useState<'modern' | 'classic' | 'minimal'>('modern');
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState('');
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
    optimizedResumeText,
    resumeId,
    comparisonSessionId,
    analysisResults,
    selectedSuggestions,
    setCurrentStep
  } = useAppStore();

  // Fetch comparison diff data
  useEffect(() => {
    const fetchComparisonData = async () => {
      console.log('🔍 Diff page state check:', {
        resumeText: !!resumeText,
        optimizedResumeText: !!optimizedResumeText,
        resumeId,
        comparisonSessionId,
        resumeTextLength: resumeText?.length || 0,
        optimizedTextLength: optimizedResumeText?.length || 0
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
        
        setIsLoading(false);
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
        console.log('📥 Fetching resume text for session:', comparisonSessionId);
        
        // Use the new /compare/{session_id}/resume-text endpoint to get both original and improved text
        const resumeData = await apiClient.getComparisonResumeText(comparisonSessionId);
        console.log('📄 Received resume text data:', resumeData);
        
        // Debug the content types and lengths
        console.log('📝 Original text preview:', resumeData.original_text?.substring(0, 200) + '...');
        console.log('📝 Improved text preview:', resumeData.improved_text?.substring(0, 200) + '...');
        console.log('📊 Text lengths:', {
          original: resumeData.original_text?.length || 0,
          improved: resumeData.improved_text?.length || 0
        });
        
        // Check if content looks like LaTeX or other formatted content
        const originalHasLatex = resumeData.original_text?.includes('\\') || resumeData.original_text?.includes('{document}');
        const improvedHasLatex = resumeData.improved_text?.includes('\\') || resumeData.improved_text?.includes('{document}');
        console.log('🔍 Content type analysis:', {
          originalHasLatex,
          improvedHasLatex,
          originalStartsWith: resumeData.original_text?.substring(0, 50),
          improvedStartsWith: resumeData.improved_text?.substring(0, 50)
        });
        
        // Clean text for better diff viewing
        const cleanOriginal = cleanTextForDiff(resumeData.original_text || '');
        const cleanImproved = cleanTextForDiff(resumeData.improved_text || '');
        
        setOriginalResumeText(cleanOriginal);
        setLocalOptimizedResumeText(cleanImproved);
        
        // Generate client-side diff for visualization using cleaned text
        const diff = generateDiff(cleanOriginal, cleanImproved);
        console.log('🔧 Generated diff results:', {
          totalChanges: diff.length,
          additions: diff.filter(d => d.type === 'addition').length,
          deletions: diff.filter(d => d.type === 'deletion').length,
          unchanged: diff.filter(d => d.type === 'unchanged').length,
          sampleChanges: diff.slice(0, 5).map(d => ({ type: d.type, content: d.content.substring(0, 50) + '...' }))
        });
        setDiffResults(diff);
        
        // Create comparison data structure for consistency
        setComparisonData({
          session_id: resumeData.session_id,
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
          editable_text: resumeData.improved_text
        });
        
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

    // Only run if we're not already loading and have necessary data
    if (!isLoading) {
      setIsLoading(true);
      fetchComparisonData();
    }
  }, [comparisonSessionId, resumeId, resumeText, optimizedResumeText, analysisResults, selectedSuggestions]);

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

  const handleBack = () => {
    router.push('/optimize');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Save the edited text
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
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">4</div>
                <span className="text-sm font-medium text-foreground">Review</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">5</div>
                <span className="text-sm font-medium text-muted-foreground">Download</span>
              </div>
            </div>
          </div>

          {(comparisonData || (diffResults.length > 0 && localOptimizedResumeText)) && (
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
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {comparisonData?.diff_data?.statistics?.additions || diffResults.filter(d => d.type === 'addition').length}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">Additions</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {comparisonData?.diff_data?.statistics?.modifications || 0}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Modifications</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {comparisonData?.diff_data?.statistics?.deletions || diffResults.filter(d => d.type === 'deletion').length}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">Deletions</div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {comparisonData?.diff_data?.statistics?.total_changes || diffResults.length}
                      </div>
                      <div className="text-sm text-primary">Total Changes</div>
                    </div>
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
                    id: 'edit',
                    label: 'Edit Resume',
                    icon: <Edit className="w-4 h-4" />
                  },
                  {
                    id: 'latex',
                    label: 'LaTeX Export',
                    icon: <Download className="w-4 h-4" />
                  }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {/* Tab Content */}
              {activeTab === 'sideBySide' && localOptimizedResumeText && (
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

              {activeTab === 'unified' && diffResults.length > 0 && (
                <div className="mb-8">
                  <DiffViewer 
                    diffResults={diffResults} 
                    title="Resume Changes Preview"
                    isLoading={false}
                  />
                </div>
              )}

              {activeTab === 'edit' && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Edit Your Resume</span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleEditToggle}
                          variant={isEditing ? "default" : "outline"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                          {isEditing ? 'Save Changes' : 'Edit Resume'}
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {isEditing 
                        ? 'Make your final edits to the resume text. Click "Save Changes" when done.'
                        : 'Your optimized resume text. Click "Edit Resume" to make changes.'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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

              {activeTab === 'latex' && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>LaTeX Export</span>
                      <div className="flex items-center gap-2">
                        <select 
                          value={latexStyle} 
                          onChange={(e) => setLatexStyle(e.target.value as 'modern' | 'classic' | 'minimal')}
                          className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="modern">Modern</option>
                          <option value="classic">Classic</option>
                          <option value="minimal">Minimal</option>
                        </select>
                        <Button
                          onClick={handleGenerateLatex}
                          disabled={isGeneratingLatex || (!editedResumeText && !localOptimizedResumeText)}
                          className="flex items-center gap-2"
                        >
                          {isGeneratingLatex ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Generate LaTeX
                            </>
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Generate a professionally formatted LaTeX version of your resume. 
                      {editedResumeText && editedResumeText !== localOptimizedResumeText 
                        ? ' Using your edited version.' 
                        : ' Using the optimized version.'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedLatex ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Generated LaTeX Code</h3>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigator.clipboard.writeText(generatedLatex)}
                            >
                              Copy LaTeX
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleGenerateLatex}
                              className="flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Regenerate
                            </Button>
                          </div>
                        </div>
                        <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96 border">
                          <pre className="text-sm font-mono whitespace-pre-wrap">
                            {generatedLatex}
                          </pre>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          LaTeX code generated with <strong>{latexStyle}</strong> style • {generatedLatex.length} characters
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Click &ldquo;Generate LaTeX&rdquo; to create a professionally formatted version of your resume.</p>
                        <p className="text-sm mt-2">Choose your preferred style and we&apos;ll generate the LaTeX code for you.</p>
                      </div>
                    )}
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
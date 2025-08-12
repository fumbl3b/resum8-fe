'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp,
  CheckCircle,
  Circle,
  Zap,
  Target,
  AlertTriangle,
  Star,
  Lightbulb,
  Filter
} from 'lucide-react';

interface Improvement {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'content' | 'keywords' | 'formatting' | 'structure';
  originalText?: string;
  suggestedText?: string;
  selected: boolean;
}

export default function OptimizePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { selectedSuggestions, toggleSuggestion, resumeId, jobAnalysis, jobDescription, analysisResults, comparisonSessionId, resumeText } = useAppStore();
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'content' | 'keywords' | 'formatting' | 'structure'>('all');
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirect if missing required data
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (!resumeId || !jobDescription) {
        router.push('/job-analysis');
      }
    }
  }, [isAuthenticated, isLoading, resumeId, jobDescription, router]);

  // Generate improvements from analysis results
  useEffect(() => {
    const generateImprovements = () => {
      console.log('🔍 Checking analysis results:', analysisResults);
      
      if (!analysisResults) {
        console.log('❌ No analysisResults found');
        setError('No analysis data found. Please go back and complete the job analysis first.');
        return;
      }

      if (!analysisResults.weaknesses) {
        console.log('❌ No weaknesses found in analysis results');
        console.log('Available keys in analysisResults:', Object.keys(analysisResults));
        setError('No improvement suggestions found in analysis results. Please try running the job analysis again.');
        return;
      }

      if (!Array.isArray(analysisResults.weaknesses) || analysisResults.weaknesses.length === 0) {
        console.log('❌ Weaknesses is not an array or is empty:', analysisResults.weaknesses);
        console.log('🔧 Attempting to generate fallback improvements...');
        
        // Try to generate fallback improvements based on other data
        if (jobAnalysis) {
          const fallbackImprovements: Improvement[] = [];
          
          // Generate improvement suggestions based on job analysis
          if (jobAnalysis.required_skills && jobAnalysis.required_skills.length > 0) {
            fallbackImprovements.push({
              id: 'fallback-1',
              title: 'Required Skills Optimization',
              description: `Consider highlighting these required skills: ${jobAnalysis.required_skills.slice(0, 3).join(', ')}`,
              impact: 'high',
              category: 'keywords',
              suggestedText: `Add these key skills to your resume: ${jobAnalysis.required_skills.slice(0, 3).join(', ')}`,
              selected: false
            });
          }
          
          if (jobAnalysis.keywords && jobAnalysis.keywords.length > 0) {
            fallbackImprovements.push({
              id: 'fallback-2',
              title: 'Keyword Integration',
              description: `Incorporate these important keywords: ${jobAnalysis.keywords.slice(0, 5).join(', ')}`,
              impact: 'medium',
              category: 'keywords',
              suggestedText: `Include these keywords throughout your resume: ${jobAnalysis.keywords.slice(0, 5).join(', ')}`,
              selected: false
            });
          }
          
          if (jobAnalysis.preferred_skills && jobAnalysis.preferred_skills.length > 0) {
            fallbackImprovements.push({
              id: 'fallback-3',
              title: 'Preferred Skills Enhancement',
              description: `Consider adding these preferred skills if you have them: ${jobAnalysis.preferred_skills.slice(0, 3).join(', ')}`,
              impact: 'medium',
              category: 'content',
              suggestedText: `Highlight any experience with: ${jobAnalysis.preferred_skills.slice(0, 3).join(', ')}`,
              selected: false
            });
          }
          
          if (fallbackImprovements.length > 0) {
            console.log('✅ Generated fallback improvements:', fallbackImprovements);
            setImprovements(fallbackImprovements);
            setIsLoadingImprovements(false);
            return;
          }
        }
        
        setError('No improvement suggestions available. The job analysis may not have completed successfully. Please try running the analysis again.');
        return;
      }

      setIsLoadingImprovements(true);
      setError('');

      try {
        console.log('✅ Processing weaknesses:', analysisResults.weaknesses);
        
        // Convert analysis weaknesses to improvements - these now come from the comparison API
        const convertedImprovements: Improvement[] = analysisResults.weaknesses.map((weakness, index) => {
          console.log(`Processing weakness ${index}:`, weakness);
          
          // Ensure we have valid impact level
          const impactLevel = ['high', 'medium', 'low'].includes(weakness.impact) ? weakness.impact : 'medium';
          
          // Use the original ID from backend if available, otherwise create one
          const improvementId = weakness.id || `improvement-${index + 1}`;
          
          const improvement = {
            id: improvementId,
            title: weakness.category || 'General Improvement',
            description: weakness.description || 'Improvement needed',
            impact: impactLevel as 'high' | 'medium' | 'low',
            category: getCategoryFromDescription(weakness.description || ''),
            suggestedText: weakness.suggestion || weakness.description,
            selected: false
          };
          
          console.log(`Generated improvement ${index} with ID ${improvementId}:`, improvement);
          return improvement;
        });

        console.log('✅ All improvements generated:', convertedImprovements);
        setImprovements(convertedImprovements);
      } catch (err) {
        console.error('❌ Error generating improvements:', err);
        setError('Failed to generate improvements from analysis data. Check console for details.');
      } finally {
        setIsLoadingImprovements(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      generateImprovements();
    }
  }, [isAuthenticated, isLoading, analysisResults]);

  // Helper function to categorize improvements based on description
  const getCategoryFromDescription = (description: string): 'content' | 'keywords' | 'formatting' | 'structure' => {
    if (!description) return 'content';
    
    const lowerDesc = description.toLowerCase();
    
    // Keywords and skills
    if (lowerDesc.includes('keyword') || lowerDesc.includes('skill') || lowerDesc.includes('buzzword') || 
        lowerDesc.includes('technical') || lowerDesc.includes('technology') || lowerDesc.includes('programming')) {
      return 'keywords';
    }
    
    // Formatting and presentation
    if (lowerDesc.includes('format') || lowerDesc.includes('bullet') || lowerDesc.includes('header') ||
        lowerDesc.includes('font') || lowerDesc.includes('spacing') || lowerDesc.includes('layout') ||
        lowerDesc.includes('alignment') || lowerDesc.includes('style')) {
      return 'formatting';
    }
    
    // Structure and organization
    if (lowerDesc.includes('structure') || lowerDesc.includes('section') || lowerDesc.includes('order') ||
        lowerDesc.includes('organize') || lowerDesc.includes('arrange') || lowerDesc.includes('sequence') ||
        lowerDesc.includes('position') || lowerDesc.includes('placement')) {
      return 'structure';
    }
    
    // Default to content for anything else
    return 'content';
  };

  // Update selected state when selectedSuggestions changes
  useEffect(() => {
    if (improvements.length > 0) {
      setImprovements(prev => prev.map(imp => ({
        ...imp,
        selected: selectedSuggestions.includes(imp.id)
      })));
    }
  }, [selectedSuggestions, improvements.length]);


  const handleToggleImprovement = (id: string) => {
    toggleSuggestion(id);
    setImprovements(prev => 
      prev.map(imp => 
        imp.id === id ? { ...imp, selected: !imp.selected } : imp
      )
    );
  };

  const handleApplySelected = async () => {
    const selectedImprovements = improvements.filter(imp => imp.selected);
    if (selectedImprovements.length === 0) {
      setError('Please select at least one improvement to apply.');
      return;
    }
    
    console.log('🚀 Applying selected improvements:', selectedImprovements);
    
    if (!comparisonSessionId) {
      console.error('❌ No comparison session ID found');
      setError('No comparison session found. Please go back and complete the job analysis.');
      router.push('/job-analysis');
      return;
    }

    if (!resumeId) {
      console.error('❌ No resume ID found');
      setError('No resume selected. Please go back to the resume selection.');
      router.push('/resume-library');
      return;
    }
    
    // Verify we have valid improvement data
    if (selectedImprovements.some(imp => !imp.id || !imp.title)) {
      console.error('❌ Invalid improvement data detected');
      setError('Invalid improvement data. Please refresh and try again.');
      return;
    }

    setIsLoadingImprovements(true);
    setError('');
    
    try {
      // Get the improvement IDs - these should match the IDs from the comparison API
      const selectedImprovementIds = selectedImprovements.map(imp => imp.id);
      
      console.log('📋 Applying improvements with session ID:', comparisonSessionId);
      console.log('🔧 Selected improvement IDs:', selectedImprovementIds);
      console.log('🎯 Selected improvements details:', selectedImprovements.map(imp => ({ 
        id: imp.id, 
        title: imp.title, 
        hasBackendId: !!imp.id && !imp.id.startsWith('improvement-') 
      })));
      
      // Validate session health before proceeding
      const sessionValidation = await apiClient.validateComparisonSession(comparisonSessionId);
      console.log('🔍 Session validation result:', sessionValidation);
      
      if (!sessionValidation.valid) {
        throw new Error(`Session invalid: ${sessionValidation.message}`);
      }
      
      if (sessionValidation.status === 'RUNNING') {
        setError('Session is still processing. Please wait a moment and try again.');
        return;
      }
      
      if (sessionValidation.status === 'ERROR') {
        throw new Error('Session processing failed. Please start over from job analysis.');
      }
      
      // Log the request payload for debugging
      console.log('📤 Request payload:', {
        session_id: comparisonSessionId,
        selected_improvements: selectedImprovementIds,
        custom_instructions: 'Keep the professional tone and ensure ATS compatibility'
      });

      // Use the /improvements/apply endpoint with session-based improvements
      const result = await apiClient.applySelectedImprovements(
        comparisonSessionId,
        selectedImprovementIds,
        'Keep the professional tone and ensure ATS compatibility'
      );
      
      console.log('✅ Improvements applied successfully:', result);
      console.log('📝 Applied improvements count:', result.changes_count);
      console.log('🆔 Applied improvement IDs:', result.applied_improvements);
      
      // Validate the result has the expected data
      if (!result.improved_text) {
        throw new Error('No improved text received from API');
      }

      if (result.changes_count === 0) {
        console.warn('⚠️ No changes were applied');
        setError('No changes were applied to your resume. Please try different improvements or contact support.');
        return;
      }
      
      // Store the improved text in the app store for the diff page
      const { setOptimizedResumeText } = useAppStore.getState();
      setOptimizedResumeText(result.improved_text);
      
      // Navigate to diff page to review changes
      router.push('/diff');
      
    } catch (error) {
      console.error('❌ Error applying improvements:', error);
      
      // Log detailed error information for debugging
      if (error && typeof error === 'object') {
        console.error('📊 Error details:', {
          message: (error as any).message,
          status: (error as any).status,
          details: (error as any).details,
          stack: (error as any).stack
        });
      }
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to apply improvements. Please try again.';
      
      if (error instanceof Error) {
        console.error('📝 Error message:', error.message);
        
        if (error.message.includes('404')) {
          errorMessage = 'Endpoint not found. The improvements/apply endpoint may not be available.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request data. Please check the improvement IDs and try again.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error occurred. Please try again in a moment.';
        } else {
          errorMessage = `API Error: ${error.message}`;
        }
      } else {
        console.error('📝 Non-Error object:', error);
        errorMessage = 'Unknown error occurred. Please check the console for details.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoadingImprovements(false);
    }
  };

  const filteredImprovements = improvements.filter(imp => {
    const matchesImpact = selectedFilter === 'all' || imp.impact === selectedFilter;
    const matchesCategory = selectedCategory === 'all' || imp.category === selectedCategory;
    return matchesImpact && matchesCategory;
  });

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getImpactIcon = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'low': return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'content': return 'bg-green-100 text-green-700';
      case 'keywords': return 'bg-purple-100 text-purple-700';
      case 'formatting': return 'bg-orange-100 text-orange-700';
      case 'structure': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const selectedCount = improvements.filter(imp => imp.selected).length;
  const highImpactSelected = improvements.filter(imp => imp.selected && imp.impact === 'high').length;

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

  if (isLoadingImprovements) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="outline"
                onClick={() => router.push('/analyze-resume')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Analysis
              </Button>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  Optimize Resume
                </h1>
              </div>
              <div className="w-32" />
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <h2 className="text-lg font-medium text-foreground mb-2">
                    Generating Improvements...
                  </h2>
                  <p className="text-muted-foreground">
                    AI is analyzing your resume against the job requirements to create personalized optimization suggestions.
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
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="outline"
                onClick={() => router.push('/analyze-resume')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Analysis
              </Button>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  Optimize Resume
                </h1>
              </div>
              <div className="w-32" />
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-lg font-medium text-foreground mb-2">
                    Unable to Generate Improvements
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {error}
                  </p>
                  <Button onClick={() => router.push('/job-application')}>
                    Start Over
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => router.push('/job-analysis')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Job Analysis
            </Button>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Optimization Suggestions
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
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">3</div>
                <span className="text-sm font-medium text-foreground">Optimize</span>
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

          {/* Summary Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>
                AI-generated suggestions to improve your resume&apos;s impact and ATS compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {improvements.filter(imp => imp.impact === 'high').length}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">High Impact</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {improvements.filter(imp => imp.impact === 'medium').length}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">Medium Impact</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {improvements.filter(imp => imp.impact === 'low').length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Low Impact</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {selectedCount}
                  </div>
                  <div className="text-sm text-primary">Selected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Impact:</span>
              {['all', 'high', 'medium', 'low'].map(filter => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter as typeof selectedFilter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Category:</span>
              {['all', 'content', 'keywords', 'formatting', 'structure'].map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category as typeof selectedCategory)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Improvements List */}
          <div className="space-y-4 mb-8">
            {filteredImprovements.map((improvement) => (
              <Card 
                key={improvement.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  improvement.selected ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => handleToggleImprovement(improvement.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {improvement.selected ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          {improvement.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(improvement.category)}>
                            {improvement.category}
                          </Badge>
                          <Badge 
                            className={`border ${getImpactColor(improvement.impact)} flex items-center gap-1`}
                          >
                            {getImpactIcon(improvement.impact)}
                            {improvement.impact} impact
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground">
                        {improvement.description}
                      </p>
                      
                      {improvement.suggestedText && improvement.suggestedText !== improvement.description && (
                        <div className="space-y-2">
                          {improvement.originalText && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                              <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                CURRENT:
                              </div>
                              <div className="text-sm text-red-800 dark:text-red-200">
                                {improvement.originalText}
                              </div>
                            </div>
                          )}
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border-l-4 border-green-500">
                            <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                              SUGGESTED IMPROVEMENT:
                            </div>
                            <div className="text-sm text-green-800 dark:text-green-200">
                              {improvement.suggestedText}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-6 bg-background/80 backdrop-blur-sm rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedCount > 0 ? (
                  <>
                    <span className="font-medium text-primary">{selectedCount}</span> improvements selected
                    {highImpactSelected > 0 && (
                      <> (including <span className="font-medium text-red-600">{highImpactSelected}</span> high-impact)</>
                    )}
                  </>
                ) : (
                  'Select improvements to continue'
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    improvements.forEach(imp => {
                      if (!imp.selected && imp.impact === 'high') {
                        handleToggleImprovement(imp.id);
                      }
                    });
                  }}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Select High Impact
                </Button>
                <Button
                  onClick={handleApplySelected}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-2"
                >
                  Apply Selected Changes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
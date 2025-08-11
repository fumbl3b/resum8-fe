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
  const { selectedSuggestions, toggleSuggestion, resumeId, jobAnalysis, jobDescription } = useAppStore();
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'content' | 'keywords' | 'formatting' | 'structure'>('all');
  const [comparisonSessionId, setComparisonSessionId] = useState<number | null>(null);
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auth disabled for testing - skip redirect
    // if (!isLoading && !isAuthenticated) {
    //   router.push('/login');
    // }
  }, [isAuthenticated, isLoading, router]);

  // Start comparison session to get improvements
  useEffect(() => {
    // Convert API improvements to UI format
    const convertApiImprovements = (apiImprovements: {
      high_impact?: Array<{
        id: string;
        category: string;
        description: string;
        original_text?: string;
        improved_text?: string;
        impact_score: number;
      }>;
      medium_impact?: Array<{
        id: string;
        category: string;
        description: string;
        original_text?: string;
        improved_text?: string;
        impact_score: number;
      }>;
      low_impact?: Array<{
        id: string;
        category: string;
        description: string;
        original_text?: string;
        improved_text?: string;
        impact_score: number;
      }>;
    }): Improvement[] => {
      const improvements: Improvement[] = [];
      let idCounter = 1;

      // Convert high impact improvements
      if (apiImprovements.high_impact) {
        apiImprovements.high_impact.forEach((item) => {
          improvements.push({
            id: (idCounter++).toString(),
            title: item.category || 'High Impact Improvement',
            description: item.description,
            impact: 'high',
            category: getCategoryFromDescription(item.description),
            originalText: item.original_text,
            suggestedText: item.improved_text,
            selected: false
          });
        });
      }

      // Convert medium impact improvements
      if (apiImprovements.medium_impact) {
        apiImprovements.medium_impact.forEach((item) => {
          improvements.push({
            id: (idCounter++).toString(),
            title: item.category || 'Medium Impact Improvement',
            description: item.description,
            impact: 'medium',
            category: getCategoryFromDescription(item.description),
            originalText: item.original_text,
            suggestedText: item.improved_text,
            selected: false
          });
        });
      }

      // Convert low impact improvements
      if (apiImprovements.low_impact) {
        apiImprovements.low_impact.forEach((item) => {
          improvements.push({
            id: (idCounter++).toString(),
            title: item.category || 'Low Impact Improvement',
            description: item.description,
            impact: 'low',
            category: getCategoryFromDescription(item.description),
            originalText: item.original_text,
            suggestedText: item.improved_text,
            selected: false
          });
        });
      }

      return improvements;
    };

    const initializeComparisonSession = async () => {
      if (!resumeId || !jobDescription) {
        setError('Missing resume or job description data. Please go back and complete the analysis.');
        return;
      }

      if (comparisonSessionId) {
        return; // Already have a session
      }

      setIsLoadingImprovements(true);
      setError('');

      try {
        // Start comparison session
        const startResponse = await apiClient.startComparison({
          base_resume_id: resumeId,
          job_description: jobDescription,
          job_title: jobAnalysis?.benefits?.join(' ') || 'Target Position'
        });

        setComparisonSessionId(startResponse.session_id);

        // Poll for completion
        const pollForCompletion = async (sessionId: number) => {
          let attempts = 0;
          const maxAttempts = 30; // 30 attempts with 2-second intervals = 1 minute max

          while (attempts < maxAttempts) {
            try {
              const sessionData = await apiClient.getComparisonSession(sessionId);

              if (sessionData.status === 'DONE') {
                if (sessionData.improvements) {
                  const convertedImprovements = convertApiImprovements(sessionData.improvements);
                  setImprovements(convertedImprovements);
                }
                break;
              } else if (sessionData.status === 'ERROR') {
                throw new Error('Comparison session failed');
              }

              await new Promise(resolve => setTimeout(resolve, 2000));
              attempts++;
            } catch (pollError) {
              console.error('Error polling session:', pollError);
              throw pollError;
            }
          }

          if (attempts >= maxAttempts) {
            throw new Error('Session timed out. Please try again.');
          }
        };

        await pollForCompletion(startResponse.session_id);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate improvements. Please try again.';
        setError(errorMessage);
        console.error('Comparison session error:', err);
      } finally {
        setIsLoadingImprovements(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      initializeComparisonSession();
    }
  }, [isAuthenticated, isLoading, resumeId, jobDescription, jobAnalysis, comparisonSessionId]);

  // Helper function to categorize improvements based on description
  const getCategoryFromDescription = (description: string): 'content' | 'keywords' | 'formatting' | 'structure' => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('keyword') || lowerDesc.includes('skill') || lowerDesc.includes('buzzword')) {
      return 'keywords';
    } else if (lowerDesc.includes('format') || lowerDesc.includes('bullet') || lowerDesc.includes('header')) {
      return 'formatting';
    } else if (lowerDesc.includes('structure') || lowerDesc.includes('section') || lowerDesc.includes('order')) {
      return 'structure';
    }
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

  const handleApplySelected = () => {
    const selectedIds = improvements.filter(imp => imp.selected).map(imp => imp.id);
    if (selectedIds.length === 0 || !comparisonSessionId) return;
    
    // Store the session ID for the diff page
    router.push(`/diff?sessionId=${comparisonSessionId}`);
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
                      
                      {improvement.originalText && improvement.suggestedText && (
                        <div className="space-y-2">
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                            <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                              BEFORE:
                            </div>
                            <div className="text-sm text-red-800 dark:text-red-200">
                              {improvement.originalText}
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border-l-4 border-green-500">
                            <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                              AFTER:
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
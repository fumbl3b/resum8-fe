'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  FileText, 
  Zap,
  ArrowRight,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useGlobalStore } from '@/stores/global-store';
import { apiClient } from '@/lib/api';
import { ResumeDocument } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface OptimizationResult {
  score: number;
  suggestions: Array<{
    category: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestion: string;
    impact: number;
  }>;
  optimized_resume: {
    content: string;
    download_url?: string;
  };
}

export default function OptimizePage() {
  const router = useRouter();
  const { userSummary } = useGlobalStore();
  const { toast } = useToast();
  
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const fetchedResumes = await apiClient.getResumes();
        const resumeList = Array.isArray(fetchedResumes) ? fetchedResumes : [];
        setResumes(resumeList.filter(r => r.is_parsed));
        
        // Auto-select default resume if available
        const defaultResume = resumeList.find(r => r.is_default && r.is_parsed);
        if (defaultResume) {
          setSelectedResume(defaultResume.id);
        }
      } catch (error) {
        console.error('Failed to fetch resumes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your resumes. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingResumes(false);
      }
    };

    fetchResumes();
  }, [toast]);

  const handleOptimize = async () => {
    if (!jobDescription.trim() || !selectedResume) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a job description and select a resume.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.optimizeResume(selectedResume, jobDescription);
      setResult(response);
      toast({
        title: 'Optimization Complete',
        description: 'Your resume has been optimized for this job posting.',
      });
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Failed to optimize your resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if user doesn't have default resume
  if (!userSummary?.has_default_resume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start">
                <Upload className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-1">
                    Upload Required
                  </h3>
                  <p className="text-amber-700 text-sm mb-3">
                    You need to upload and set a default resume before using the optimization feature.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => router.push('/resumes/upload')}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resume Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (result) {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'HIGH': return 'destructive';
        case 'MEDIUM': return 'default';
        case 'LOW': return 'secondary';
        default: return 'secondary';
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-8 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Target className="w-4 h-4 mr-2" />
                Optimization Results
              </Badge>
              <Badge 
                variant={result.score >= 80 ? 'default' : result.score >= 60 ? 'secondary' : 'destructive'}
                className="px-3 py-1"
              >
                Score: {result.score}/100
              </Badge>
            </div>
            
            <h1 className="text-4xl font-bold mb-2">Resume Optimization Complete</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Your resume has been tailored for this specific job posting
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Suggestions */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Optimization Suggestions</h2>
              <div className="space-y-4">
                {result.suggestions
                  .sort((a, b) => {
                    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                  })
                  .map((suggestion, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{suggestion.category}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              +{suggestion.impact} pts
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Optimized Resume */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Optimized Resume</h2>
                {result.optimized_resume.download_url && (
                  <Button onClick={() => window.open(result.optimized_resume.download_url)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
              
              <Card className="h-[600px]">
                <CardContent className="p-6 h-full">
                  <div className="h-full overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {result.optimized_resume.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" onClick={() => setResult(null)}>
              Optimize Another
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-8 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Target className="w-4 h-4 mr-2" />
              Optimize Resume
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">Optimize with Job Description</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Paste a job description to get targeted improvements for your existing resume
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Job-Specific Optimization
            </CardTitle>
            <CardDescription>
              Provide a job description and select which resume to optimize
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resume Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Resume to Optimize</label>
              {isLoadingResumes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading resumes...</span>
                </div>
              ) : (
                <Select value={selectedResume} onValueChange={setSelectedResume}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a resume..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        <div className="flex items-center">
                          <span>{resume.title}</span>
                          {resume.is_default && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {resumes.length === 0 && !isLoadingResumes && (
                <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
                  <span className="text-sm text-amber-700">
                    No processed resumes found. Upload and process a resume first.
                  </span>
                </div>
              )}
            </div>

            {/* Job Description Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Description</label>
              <Textarea
                placeholder="Paste the complete job description here. Include job title, requirements, responsibilities, and any specific skills or qualifications mentioned..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Provide detailed job information for better optimization</span>
                <span>{jobDescription.length} characters</span>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleOptimize}
              disabled={isLoading || !jobDescription.trim() || !selectedResume}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing Resume...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Optimize Resume
                </>
              )}
            </Button>

            {/* Features List */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-3">What you'll get:</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Job-specific keyword optimization',
                  'Tailored skill highlighting',
                  'ATS-friendly formatting',
                  'Impact-scored suggestions',
                  'Instant downloadable PDF',
                  'Priority-ranked improvements'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
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
  Upload,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function JobApplicationPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { resumeText, resumeId, setJobDescription, setJobAnalysis, setCurrentStep, jobAnalysis } = useAppStore();
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [step, setStep] = useState<'job-description' | 'resume-selection'>('job-description');

  useEffect(() => {
    // Auth disabled for testing - skip redirect
    // if (!isLoading && !isAuthenticated) {
    //   router.push('/login');
    // }
  }, [isAuthenticated, isLoading, router]);

  const jobAnalysisMutation = useMutation({
    mutationFn: (jobDescription: string) => apiClient.analyzeJob({ job_description: jobDescription }),
    onSuccess: (data) => {
      setJobDescription(jobDescriptionText);
      setJobAnalysis(data);
      setStep('resume-selection');
    },
    onError: (error) => {
      console.error('Job analysis failed:', error);
    },
  });

  const handleJobDescriptionSubmit = () => {
    if (!jobDescriptionText.trim()) return;
    
    jobAnalysisMutation.mutate(jobDescriptionText);
  };

  const handleUseExistingResume = () => {
    if (resumeId) {
      setCurrentStep('analyze');
      router.push('/analyze-resume');
    }
  };

  const handleUploadNewResume = () => {
    router.push('/analyze-resume');
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
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Job Application Flow
              </h1>
            </div>
            <div className="w-32" />
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'job-description' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  1
                </div>
                <span className={`text-sm font-medium ${
                  step === 'job-description' ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  Job Description
                </span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'resume-selection' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  2
                </div>
                <span className={`text-sm font-medium ${
                  step === 'resume-selection' ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  Resume Selection
                </span>
              </div>
            </div>
          </div>

          {step === 'job-description' && (
            <Card>
              <CardHeader>
                <CardTitle>Paste Job Description</CardTitle>
                <CardDescription>
                  Copy and paste the job description you want to optimize your resume for. 
                  Our AI will analyze the requirements and help tailor your resume accordingly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
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
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Tips for best results:
                      </p>
                      <ul className="text-blue-700 dark:text-blue-200 space-y-1">
                        <li>• Include the complete job posting, not just requirements</li>
                        <li>• Include company information and job responsibilities</li>
                        <li>• Include preferred qualifications and skills</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {jobAnalysisMutation.isError && (
                  <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900 dark:text-red-100">
                        Analysis Failed
                      </span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-200">
                      Failed to analyze job description. Please check your connection and try again.
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleJobDescriptionSubmit}
                    disabled={jobDescriptionText.trim().length < 50 || jobAnalysisMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {jobAnalysisMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Job Requirements
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'resume-selection' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Requirements Analyzed</CardTitle>
                  <CardDescription>
                    Great! We&apos;ve analyzed the job description. Now choose how you&apos;d like to proceed with your resume.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900 dark:text-green-100">
                        Job Analysis Complete
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-200 mb-3">
                      We&apos;ve extracted key requirements, skills, and keywords from the job posting.
                    </p>
                    
                    {jobAnalysis && (
                      <div className="space-y-3">
                        {jobAnalysis.keywords && jobAnalysis.keywords.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                              Key Keywords:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {jobAnalysis.keywords.slice(0, 8).map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                              {jobAnalysis.keywords.length > 8 && (
                                <Badge variant="outline" className="text-xs">
                                  +{jobAnalysis.keywords.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {jobAnalysis.required_skills && jobAnalysis.required_skills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                              Required Skills:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {jobAnalysis.required_skills.slice(0, 6).map((skill, index) => (
                                <Badge key={index} variant="default" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {jobAnalysis.required_skills.length > 6 && (
                                <Badge variant="outline" className="text-xs">
                                  +{jobAnalysis.required_skills.length - 6} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {resumeId ? (
                      <Card className="border-2 border-primary/20 bg-primary/5">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Use Existing Resume
                          </CardTitle>
                          <CardDescription>
                            Continue with your previously uploaded resume
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                              <p className="text-sm text-muted-foreground mb-1">Current Resume:</p>
                              {resumeText ? (
                                <>
                                  <p className="text-xs text-foreground line-clamp-3">
                                    {resumeText.substring(0, 150)}...
                                  </p>
                                  <Badge variant="secondary" className="mt-2">
                                    {resumeText.length} characters
                                  </Badge>
                                </>
                              ) : (
                                <div className="text-xs text-muted-foreground py-2">
                                  <p>Resume uploaded (ID: {resumeId})</p>
                                  <p>Content will be available after analysis</p>
                                </div>
                              )}
                            </div>
                            <Button 
                              onClick={handleUseExistingResume}
                              className="w-full flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Use This Resume
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-2 border-dashed border-muted-foreground/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="w-5 h-5" />
                            No Resume Found
                          </CardTitle>
                          <CardDescription>
                            You haven&apos;t uploaded a resume yet
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload a resume first to use this option
                          </p>
                          <Button variant="outline" disabled className="w-full">
                            No Resume Available
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="w-5 h-5 text-blue-600" />
                          Upload New Resume
                        </CardTitle>
                        <CardDescription>
                          Upload a different resume for this job application
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Choose this option if you want to:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Upload a different version of your resume</li>
                            <li>• Start fresh with a new document</li>
                            <li>• Use a role-specific resume variant</li>
                          </ul>
                          <Button 
                            onClick={handleUploadNewResume}
                            variant="outline"
                            className="w-full flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Upload New Resume
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
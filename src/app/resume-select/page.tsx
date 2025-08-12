'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { ResumeUploader } from '@/components/forms/resume-uploader';
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText,
  CheckCircle,
  Upload
} from 'lucide-react';

export default function ResumeSelectPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { setResumeId, resumeId } = useAppStore();
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(resumeId);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch user's resumes
  const { data: resumesData, refetch, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => apiClient.getResumes(),
    enabled: isAuthenticated,
  });

  const handleSelectResume = (resumeIdToSelect: number) => {
    setSelectedResumeId(resumeIdToSelect);
    setResumeId(resumeIdToSelect);
  };

  const handleNext = () => {
    if (selectedResumeId) {
      router.push('/job-analysis');
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    refetch(); // Refresh the resume list
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
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Select Resume
              </h1>
            </div>
            <div className="w-32" />
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">1</div>
                <span className="text-sm font-medium text-foreground">Resume</span>
              </div>
              <div className="flex-1 h-px bg-muted mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">2</div>
                <span className="text-sm font-medium text-muted-foreground">Job Analysis</span>
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

          {showUpload ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Resume</CardTitle>
                  <CardDescription>
                    Upload a resume file to get started with optimization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeUploader onUploadComplete={handleUploadComplete} />
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={() => setShowUpload(false)}>
                      Back to Resume Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Resume</CardTitle>
                  <CardDescription>
                    Select an existing resume or upload a new one to optimize for a specific job
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resumesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground mb-2">Loading your resumes...</p>
                      <p className="text-sm text-muted-foreground">Please wait while we fetch your saved resumes</p>
                    </div>
                  ) : resumesData?.resumes && resumesData.resumes.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Existing Resumes:</h3>
                      <div className="grid gap-4">
                        {resumesData.resumes.map((resume) => (
                          <Card 
                            key={resume.id} 
                            className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                              selectedResumeId === resume.id ? 'border-primary bg-primary/5' : 'hover:border-primary/20'
                            }`}
                            onClick={() => handleSelectResume(resume.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-foreground">{resume.title}</h4>
                                <div className="flex items-center gap-2">
                                  {selectedResumeId === resume.id && (
                                    <CheckCircle className="w-5 h-5 text-primary" />
                                  )}
                                  {resume.is_default && (
                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                  )}
                                  <Badge variant={resume.is_parsed ? "default" : "outline"} className="text-xs">
                                    {resume.is_parsed ? "Ready" : "Processing"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <p>Size: {Math.round(resume.size_bytes / 1024)} KB</p>
                                <p>Created: {new Date(resume.created_at).toLocaleDateString()}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No resumes found</p>
                      <p className="text-sm text-muted-foreground mb-6">Upload your first resume to get started</p>
                    </div>
                  )}

                  <div className="flex justify-center mt-6">
                    <Button 
                      onClick={() => setShowUpload(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload New Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!selectedResumeId}
                  className="flex items-center gap-2"
                >
                  Continue to Job Analysis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
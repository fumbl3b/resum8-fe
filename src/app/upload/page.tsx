'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JobDescriptionInput } from '@/components/forms/job-description-input';
import { ResumeUploader } from '@/components/forms/resume-uploader';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const { jobDescription, resumeText, setCurrentStep } = useAppStore();

  const canProceed = jobDescription.trim() && resumeText.trim();

  const handleNext = () => {
    if (canProceed) {
      setCurrentStep('analyze');
      router.push('/analyze');
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Upload Resume & Job Description
            </h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <ResumeUploader />
            <JobDescriptionInput />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ready to Analyze?</CardTitle>
              <CardDescription>
                Once you've uploaded your resume and job description, we can analyze the job requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {!resumeText && !jobDescription && 'Upload resume and add job description to continue'}
                  {!resumeText && jobDescription && 'Upload your resume to continue'}
                  {resumeText && !jobDescription && 'Add job description to continue'}
                  {canProceed && <span className="text-success">✓ Ready to analyze job requirements</span>}
                </div>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex items-center gap-2"
                >
                  Analyze Job
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
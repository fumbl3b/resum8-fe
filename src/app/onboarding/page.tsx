'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RouteGuard } from '@/components/auth/route-guard';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function OnboardingPage() {
  return (
    <RouteGuard requireAuth={true}>
      <OnboardingContent />
    </RouteGuard>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { refreshUserSummary } = useGlobalAuth();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    uploaded: boolean;
    parsing: boolean;
    completed: boolean;
  }>({
    uploaded: false,
    parsing: false,
    completed: false,
  });
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      if (!title) {
        // Auto-generate title from filename
        const nameWithoutExt = uploadedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
      setError('');
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('Please select a file and provide a title');
      return;
    }

    setIsUploading(true);
    setError('');
    
    try {
      // Step 1: Upload the resume
      setUploadProgress({ uploaded: false, parsing: false, completed: false });
      
      const response = await apiClient.createResume({
        file,
        title: title.trim(),
      });
      
      setUploadProgress({ uploaded: true, parsing: true, completed: false });
      
      // Step 2: Poll for parsing completion
      const resumeId = response.id;
      await pollForParsing(resumeId);
      
      setUploadProgress({ uploaded: true, parsing: false, completed: true });
      
      // Step 3: Refresh user summary and redirect
      await refreshUserSummary();
      
      // Small delay to show success state
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload resume. Please try again.');
      setIsUploading(false);
      setUploadProgress({ uploaded: false, parsing: false, completed: false });
    }
  };

  const pollForParsing = async (resumeId: number): Promise<void> => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      try {
        const resumes = await apiClient.getResumes();
        const resume = resumes.resumes.find(r => r.id === resumeId);
        
        if (resume && resume.parsed_at) {
          return; // Parsing completed
        }
        
        // Wait 1 second before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
      } catch (error) {
        console.error('Error polling for parsing:', error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If we get here, parsing took too long, but don't fail the upload
    console.warn('Resume parsing took longer than expected');
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Welcome to Resum8!
            </h1>
            <p className="text-lg text-muted-foreground">
              Let&apos;s start by uploading your default resume. This will be the foundation for all your optimizations.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload Your Default Resume</CardTitle>
              <CardDescription>
                Upload a PDF, DOCX, DOC, or TXT file. We&apos;ll parse it and make it ready for optimization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div>
                <Label>Resume File</Label>
                <div
                  {...getRootProps()}
                  className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/10'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-primary" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-lg font-medium">
                        {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Or click to browse files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF, DOCX, DOC, TXT (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <Label htmlFor="title">Resume Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Software Engineer Resume"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give your resume a descriptive title for easy identification
                </p>
              </div>

              {/* Progress Steps */}
              {isUploading && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {uploadProgress.uploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    <span className={uploadProgress.uploaded ? 'text-green-600' : 'text-foreground'}>
                      Uploading resume...
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadProgress.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : uploadProgress.parsing ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/25" />
                    )}
                    <span className={uploadProgress.completed ? 'text-green-600' : uploadProgress.parsing ? 'text-foreground' : 'text-muted-foreground'}>
                      Parsing resume text...
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadProgress.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/25" />
                    )}
                    <span className={uploadProgress.completed ? 'text-green-600' : 'text-muted-foreground'}>
                      Setting up your account...
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || !title.trim() || isUploading}
                className="w-full"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {uploadProgress.completed ? 'Finishing up...' : 
                     uploadProgress.parsing ? 'Processing...' : 'Uploading...'}
                  </>
                ) : (
                  'Upload Resume'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
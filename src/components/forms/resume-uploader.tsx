'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function ResumeUploader() {
  const { resumeFile, resumeText, setResumeFile, setResumeText, setResumeId } = useAppStore();
  const [uploadedResume, setUploadedResume] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadResume(file),
    onSuccess: (data) => {
      setUploadedResume(data);
      setResumeId(data.id);
      // Note: We'll wait for the resume to be parsed to get the text
      // For now, we'll use a placeholder text extraction
      // In the real implementation, you might need to poll for parsing completion
      if (data.is_parsed) {
        // Resume already parsed, we'd get text another way
        // For now, keeping the old text extraction for compatibility
      }
    },
    onError: (error) => {
      console.error('Failed to upload resume:', error);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    // Handle rejected files
    if (fileRejections.length > 0) {
      console.error('File rejected:', fileRejections[0]);
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      // Validate file extension
      const allowedExtensions = ['pdf', 'doc', 'docx', 'txt'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        console.error(`Unsupported file type: ${fileExtension}`);
        return;
      }

      console.log(`Uploading file: ${file.name} (${fileExtension})`);
      setResumeFile(file);
      uploadMutation.mutate(file);
    }
  }, [setResumeFile, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/x-tex': ['.tex'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  const handleRemove = () => {
    setResumeFile(undefined);
    setResumeText('');
    setUploadedResume(null);
    setResumeId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
        <CardDescription>
          Upload your resume in PDF, DOC, DOCX, or TEX format
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!resumeFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/50 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              {isDragActive ? 'Drop your resume here...' : 'Upload your resume'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Drag and drop or click to select a file
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Supports PDF, DOC, DOCX, TXT (max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{resumeFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {uploadMutation.isPending && (
              <div className="text-sm text-info">
                Uploading resume...
              </div>
            )}

            {uploadMutation.isError && (
              <div className="text-sm text-destructive">
                <p className="font-medium">Failed to upload resume</p>
                <p className="mt-1">
                  {uploadMutation.error?.details || 
                   uploadMutation.error?.message || 
                   'Please try a different file or format (PDF, DOC, DOCX, TXT).'}
                </p>
              </div>
            )}

            {uploadedResume && (
              <div className="text-sm text-success">
                ✓ Resume uploaded successfully ({Math.round(uploadedResume.size_bytes / 1024)} KB)
                {uploadedResume.is_parsed && (
                  <span> - Ready for analysis</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
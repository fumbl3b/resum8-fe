'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function ResumeUploader() {
  const { resumeFile, resumeText, setResumeFile, setResumeText } = useAppStore();

  const extractTextMutation = useMutation({
    mutationFn: (file: File) => apiClient.extractResumeText(file),
    onSuccess: (data) => {
      setResumeText(data.text);
    },
    onError: (error) => {
      console.error('Failed to extract text:', error);
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
      const allowedExtensions = ['pdf', 'doc', 'docx', 'tex'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        console.error(`Unsupported file type: ${fileExtension}`);
        return;
      }

      console.log(`Uploading file: ${file.name} (${fileExtension})`);
      setResumeFile(file);
      extractTextMutation.mutate(file);
    }
  }, [setResumeFile, extractTextMutation]);

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
              Supports PDF, DOC, DOCX, TEX (max 10MB)
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

            {extractTextMutation.isPending && (
              <div className="text-sm text-info">
                Extracting text from resume...
              </div>
            )}

            {extractTextMutation.isError && (
              <div className="text-sm text-destructive">
                <p className="font-medium">Failed to extract text</p>
                <p className="mt-1">
                  {extractTextMutation.error?.details || 
                   extractTextMutation.error?.message || 
                   'Please try a different file or format (PDF, DOC, DOCX, TEX).'}
                </p>
              </div>
            )}

            {resumeText && (
              <div className="text-sm text-success">
                ✓ Resume text extracted successfully ({resumeText.length} characters)
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
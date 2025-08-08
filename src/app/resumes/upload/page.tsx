'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '@/lib/api';
import { CreateResumeRequest } from '@/lib/types';

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  file: z.instanceof(File),
});

type UploadSchema = z.infer<typeof uploadSchema>;

export default function UploadResumePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UploadSchema>({
    resolver: zodResolver(uploadSchema),
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setValue('file', acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const onSubmit = async (data: UploadSchema) => {
    setIsUploading(true);
    setError(null);

    try {
      await apiClient.createResume(data);
      router.push('/resumes');
    } catch (err) {
      setError('Failed to upload resume.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload a New Resume</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                {...register('title')}
                placeholder="Resume Title (e.g., 'Software Engineer Resume')"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div
              {...getRootProps()}
              className={`p-10 border-2 border-dashed rounded-md text-center cursor-pointer ${isDragActive ? 'border-primary' : ''}`}>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag 'n' drop a file here, or click to select a file</p>
              )}
            </div>
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>}

            {error && <p className="text-red-500 text-center">{error}</p>}

            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

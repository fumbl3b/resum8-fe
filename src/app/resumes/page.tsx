
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Upload } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ResumesListResponse } from '@/lib/types';

export default function ResumeLibrary() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumesListResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const data = await apiClient.getResumes();
        setResumes(data);
      } catch (err) {
        setError('Failed to fetch resumes.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const handleUploadClick = () => {
    router.push('/resumes/upload');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Resume Library</h1>
        <Button onClick={handleUploadClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload New Resume
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resumes.map((resume) => (
          <Card key={resume.id}>
            <CardHeader>
              <CardTitle>{resume.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uploaded on {new Date(resume.created_at).toLocaleDateString()}
              </p>
              {/* Add more resume details and actions here */}
            </CardContent>
          </Card>
        ))}
        <Card
          className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed hover:border-primary hover:bg-accent cursor-pointer"
          onClick={handleUploadClick}
        >
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Upload a New Resume</h3>
          <p className="text-sm text-muted-foreground">
            Supports PDF, DOCX, and TXT formats.
          </p>
        </Card>
      </div>
    </div>
  );
}

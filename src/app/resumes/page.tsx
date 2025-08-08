
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Upload, MoreVertical, Trash2, Star } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ResumeDocument } from '@/lib/types';
import { useGlobalStore } from '@/stores/global-store';

export default function ResumeLibrary() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userSummary, fetchUserSummary } = useGlobalStore();

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getResumes();
      setResumes(data);
    } catch (err) {
      setError('Failed to fetch resumes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
    fetchUserSummary();
  }, [fetchUserSummary]);

  const handleUploadClick = () => {
    router.push('/resumes/upload');
  };

  const handleSetDefault = async (resumeId: number) => {
    try {
      await apiClient.setDefaultResume(resumeId);
      await fetchUserSummary();
    } catch (error) {
      console.error("Failed to set default resume", error);
    }
  };

  const handleDelete = async (resumeId: number) => {
    try {
      await apiClient.deleteResume(resumeId);
      await fetchResumes();
      if (userSummary?.default_resume_id === resumeId) {
        await fetchUserSummary();
      }
    } catch (error) {
      console.error("Failed to delete resume", error);
    }
  };

  import { Skeleton } from '@/components/ui/skeleton';

// ... (imports)

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-9 w-1/4" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
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

      {resumes.length === 0 ? (
         <Card
            className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed"
          >
            <h3 className="text-xl font-semibold mb-4">Your library is empty</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first resume to get started.
            </p>
            <Button onClick={handleUploadClick}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Resume
            </Button>
          </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => {
            const isDefault = resume.id === userSummary?.default_resume_id;
            return (
              <Card key={resume.id} className={isDefault ? 'border-primary' : ''}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {resume.title}
                      {isDefault && <Badge>Default</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">
                      Uploaded on {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleSetDefault(resume.id)}
                        disabled={isDefault}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(resume.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {resume.parsed_at ? `Parsed successfully.` : `Parsing...`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
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
      )}
    </div>
  );
}

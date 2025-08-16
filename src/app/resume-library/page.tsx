'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  FolderOpen,
  FileText,
  Calendar,
  Download,
  Eye,
  Trash2,
  Plus,
  Star,
  Target,
  Filter,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Resume {
  id: number;
  title: string;
  createdAt: Date;
  targetRole?: string;
  jobDescription?: string;
  derivedFrom?: string;
  isDefault: boolean;
}

export default function ResumeLibraryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTitles, setEditingTitles] = useState<{[key: number]: string}>({});

  useEffect(() => {
    
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch real resumes from API - only when auth is fully loaded and user is authenticated
  useEffect(() => {
    const fetchResumes = async () => {
      // Don't fetch if still loading auth or not authenticated
      if (isLoading || !isAuthenticated) return;
      
      try {
        setLoadingResumes(true);
        setError(null);
        
        console.log('📚 Fetching resume library...');
        const response = await apiClient.getResumeLibrary();
        console.log('📚 Resume library response:', response);
        
        // Transform API response to frontend format
        const transformedResumes: Resume[] = response.resumes.map(apiResume => ({
          id: apiResume.id,
          title: apiResume.title,
          createdAt: new Date(apiResume.created_at),
          isDefault: apiResume.is_default,
          targetRole: apiResume.optimizations.length > 0 ? apiResume.optimizations[0].job_title : undefined,
          jobDescription: apiResume.optimizations.length > 0 ? (apiResume.optimizations[0] as any).job_description : undefined,
          derivedFrom: (apiResume as any).parent_resume_id ? `Derived from Resume #${(apiResume as any).parent_resume_id}` : undefined,
        }));
        
        setResumes(transformedResumes);
      } catch (error) {
        console.error('Failed to fetch resumes:', error);
        setError('Failed to load resumes. Please try again.');
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchResumes();
  }, [isLoading, isAuthenticated]);

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.targetRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.jobDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleRenameResume = (resumeId: number, newTitle: string) => {
    setResumes(prev => prev.map(r => 
      r.id === resumeId ? { ...r, title: newTitle } : r
    ));
    setEditingTitles(prev => {
      const newState = { ...prev };
      delete newState[resumeId];
      return newState;
    });
  };

  const handleViewResume = (resumeId: number) => {
    // In a real app, this would open the resume in a viewer/editor
    console.log('View resume:', resumeId);
  };

  const handleDownloadResume = (resumeId: number) => {
    // In a real app, this would trigger a download
    console.log('Download resume:', resumeId);
  };

  const handleDeleteResume = async (resumeId: number) => {
    try {
      await apiClient.deleteResume(resumeId);
      setResumes(prev => prev.filter(r => r.id !== resumeId));
    } catch (error) {
      console.error('Failed to delete resume:', error);
      setError('Failed to delete resume. Please try again.');
    }
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
        <div className="max-w-7xl mx-auto">
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
              <FolderOpen className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Resume Library
              </h1>
            </div>
            <Button
              onClick={() => router.push('/analyze-resume')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resumes by title, role, or job description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error Loading Resumes
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setError(null);
                        window.location.reload();
                      }}
                      className="mt-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resume Grid */}
          {loadingResumes ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold mb-2">Loading your resumes...</h3>
                <p className="text-muted-foreground">
                  Please wait while we fetch your resume library
                </p>
              </CardContent>
            </Card>
          ) : filteredResumes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No resumes found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first resume'}
                </p>
                <Button onClick={() => router.push('/analyze-resume')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Resume
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredResumes.map((resume) => (
                <Card key={resume.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingTitles[resume.id] !== undefined ? (
                          <Input
                            value={editingTitles[resume.id]}
                            onChange={(e) => setEditingTitles(prev => ({ ...prev, [resume.id]: e.target.value }))}
                            onBlur={() => handleRenameResume(resume.id, editingTitles[resume.id])}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameResume(resume.id, editingTitles[resume.id]);
                              }
                            }}
                            className="text-lg font-semibold"
                            autoFocus
                          />
                        ) : (
                          <CardTitle 
                            className="text-lg line-clamp-2 cursor-pointer hover:text-primary"
                            onClick={() => setEditingTitles(prev => ({ ...prev, [resume.id]: resume.title }))}
                          >
                            {resume.title}
                          </CardTitle>
                        )}
                        <CardDescription className="mt-1">
                          {resume.targetRole && (
                            <span className="font-medium">{resume.targetRole}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* History */}
                      {resume.derivedFrom && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            History
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            {resume.derivedFrom}
                          </p>
                        </div>
                      )}

                      {/* Job Description */}
                      {resume.jobDescription && (
                        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                            Job Description
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-300 line-clamp-3">
                            {resume.jobDescription}
                          </p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {resume.createdAt.toLocaleDateString()}
                        </div>
                        {resume.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewResume(resume.id)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadResume(resume.id)}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteResume(resume.id)}
                          className="px-2"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
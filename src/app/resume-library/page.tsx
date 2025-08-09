'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
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
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Resume {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  targetRole?: string;
  company?: string;
  status: 'draft' | 'optimized' | 'generated';
  optimizationScore?: number;
  tags: string[];
  previewText: string;
  fileSize: string;
}

export default function ResumeLibraryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'optimized' | 'generated'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Mock data for resumes
  useEffect(() => {
    const mockResumes: Resume[] = [
      {
        id: '1',
        title: 'Senior Software Engineer Resume',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        targetRole: 'Senior Software Engineer',
        company: 'Google',
        status: 'generated',
        optimizationScore: 92,
        tags: ['React', 'Node.js', 'AWS', 'TypeScript'],
        previewText: 'Experienced Senior Software Engineer with 8+ years developing scalable web applications using React, Node.js, and AWS...',
        fileSize: '245 KB'
      },
      {
        id: '2', 
        title: 'Full Stack Developer Resume',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        targetRole: 'Full Stack Developer',
        company: 'Meta',
        status: 'optimized',
        optimizationScore: 87,
        tags: ['JavaScript', 'Python', 'PostgreSQL', 'Docker'],
        previewText: 'Versatile Full Stack Developer specializing in modern web technologies with expertise in JavaScript, Python...',
        fileSize: '198 KB'
      },
      {
        id: '3',
        title: 'Frontend Developer Resume',
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-15'),
        targetRole: 'Frontend Developer',
        company: 'Airbnb',
        status: 'generated',
        optimizationScore: 89,
        tags: ['Vue.js', 'CSS', 'UI/UX', 'Testing'],
        previewText: 'Creative Frontend Developer with passion for creating intuitive user interfaces using Vue.js, modern CSS...',
        fileSize: '176 KB'
      },
      {
        id: '4',
        title: 'DevOps Engineer Resume',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-12'),
        targetRole: 'DevOps Engineer',
        company: 'Netflix',
        status: 'draft',
        tags: ['Kubernetes', 'CI/CD', 'Terraform', 'Monitoring'],
        previewText: 'Results-driven DevOps Engineer with expertise in containerization, infrastructure automation, and monitoring...',
        fileSize: '203 KB'
      },
      {
        id: '5',
        title: 'Product Manager Resume',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-10'),
        targetRole: 'Senior Product Manager',
        company: 'Spotify',
        status: 'optimized',
        optimizationScore: 85,
        tags: ['Strategy', 'Analytics', 'Agile', 'Leadership'],
        previewText: 'Strategic Product Manager with 6+ years experience driving product development and cross-functional team leadership...',
        fileSize: '189 KB'
      }
    ];

    setResumes(mockResumes);
  }, []);

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.targetRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || resume.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case 'oldest':
        return a.updatedAt.getTime() - b.updatedAt.getTime();
      case 'score':
        return (b.optimizationScore || 0) - (a.optimizationScore || 0);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: Resume['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'optimized': return 'bg-blue-100 text-blue-700';
      case 'generated': return 'bg-green-100 text-green-700';
    }
  };

  const getStatusIcon = (status: Resume['status']) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'optimized': return <Target className="w-4 h-4" />;
      case 'generated': return <Star className="w-4 h-4" />;
    }
  };

  const handleViewResume = (resumeId: string) => {
    // In a real app, this would open the resume in a viewer/editor
    console.log('View resume:', resumeId);
  };

  const handleDownloadResume = (resumeId: string) => {
    // In a real app, this would trigger a download
    console.log('Download resume:', resumeId);
  };

  const handleDeleteResume = (resumeId: string) => {
    setResumes(prev => prev.filter(r => r.id !== resumeId));
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

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {resumes.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Resumes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {resumes.filter(r => r.status === 'generated').length}
                </div>
                <div className="text-sm text-muted-foreground">Generated</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {resumes.filter(r => r.status === 'optimized').length}
                </div>
                <div className="text-sm text-muted-foreground">Optimized</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {resumes.filter(r => r.optimizationScore && r.optimizationScore >= 90).length}
                </div>
                <div className="text-sm text-muted-foreground">High Score (90+)</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search resumes by title, role, company, or skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Status:</span>
                  {['all', 'draft', 'optimized', 'generated'].map(status => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(status as typeof filterStatus)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="score">Highest Score</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume Grid */}
          {filteredResumes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No resumes found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' 
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
                        <CardTitle className="text-lg line-clamp-2">
                          {resume.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {resume.targetRole && (
                            <span className="font-medium">{resume.targetRole}</span>
                          )}
                          {resume.company && (
                            <span className="text-muted-foreground"> at {resume.company}</span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(resume.status)} flex items-center gap-1`}>
                        {getStatusIcon(resume.status)}
                        {resume.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Score */}
                      {resume.optimizationScore && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Optimization Score</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${resume.optimizationScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-primary">
                              {resume.optimizationScore}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {resume.previewText}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {resume.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {resume.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{resume.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {resume.updatedAt.toLocaleDateString()}
                        </div>
                        <span>{resume.fileSize}</span>
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
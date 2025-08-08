'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  FileText, 
  Zap, 
  ArrowRight,
  Upload,
  BarChart3,
  Settings,
  BookOpen,
  Target,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { useGlobalStore } from '@/stores/global-store';
import { apiClient } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const { userSummary } = useGlobalStore();
  const [recentResumes, setRecentResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const resumes = await apiClient.getResumes();
        setRecentResumes(Array.isArray(resumes) ? resumes.slice(0, 3) : []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const workflows = [
    {
      id: 'analyze',
      title: 'Analyze Job Posting',
      description: 'Extract keywords and requirements from any job posting to understand what employers want',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      action: () => router.push('/analyze'),
      badges: ['Quick Start', 'No Resume Needed'],
      features: [
        'AI keyword extraction',
        'Requirement analysis',
        'Company culture insights',
        'Skill gap identification'
      ]
    },
    {
      id: 'compare',
      title: 'Compare & Optimize Resume',
      description: 'Upload your resume and get AI-powered suggestions to improve your match with job postings',
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
      action: () => router.push('/compare'),
      badges: ['Most Popular', 'Full Analysis'],
      features: [
        'Side-by-side comparison',
        'ATS optimization',
        'Impact scoring',
        'Professional LaTeX output'
      ],
      disabled: !userSummary?.has_default_resume,
      disabledReason: 'Upload a resume first'
    },
    {
      id: 'optimize',
      title: 'Optimize with Job Description',
      description: 'Paste a job description and get targeted improvements for your existing resume',
      icon: Target,
      color: 'from-green-500 to-green-600',
      action: () => router.push('/optimize'),
      badges: ['Job-Specific', 'Quick Optimization'],
      features: [
        'Job-specific suggestions',
        'Keyword optimization',
        'Tailored improvements',
        'Instant results'
      ],
      disabled: !userSummary?.has_default_resume,
      disabledReason: 'Upload a resume first'
    },
    {
      id: 'resumes',
      title: 'Manage Resumes',
      description: 'Upload, organize, and manage multiple versions of your resume with easy switching',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      action: () => router.push('/resumes'),
      badges: ['Organization', 'Multi-Version'],
      features: [
        'Multiple resume versions',
        'Set default resume',
        'Download management',
        'Parse status tracking'
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-8 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="px-3 py-1">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Badge>
            <Badge 
              variant={userSummary?.onboarding_stage === 'READY' ? 'default' : 'outline'}
              className="px-3 py-1"
            >
              {userSummary?.onboarding_stage === 'READY' ? 'Ready' : 'Setup Needed'}
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">Welcome to Resum8</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Choose your workflow below to start optimizing your resume with AI-powered insights
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Resumes</p>
                  <p className="text-2xl font-bold">{recentResumes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Default Resume</p>
                  <p className="text-2xl font-bold">
                    {userSummary?.has_default_resume ? '✓' : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm font-bold">
                    {userSummary?.onboarding_stage === 'READY' ? 'All Set!' : 'Setup Needed'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding Alert */}
        {userSummary?.onboarding_stage !== 'READY' && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-1">
                    Complete Your Setup
                  </h3>
                  <p className="text-amber-700 text-sm mb-3">
                    {userSummary?.onboarding_stage === 'NEW' 
                      ? 'Upload your first resume to unlock all features and start optimizing.'
                      : 'Set a default resume to access comparison and optimization features.'
                    }
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => router.push('/resumes/upload')}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resume Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflow Options */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Choose Your Workflow</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              
              return (
                <Card 
                  key={workflow.id} 
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    workflow.disabled ? 'opacity-60' : 'hover:-translate-y-1'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${workflow.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${workflow.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {workflow.badges.map((badge) => (
                          <Badge key={badge} variant="secondary" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg mb-2">{workflow.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {workflow.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {workflow.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-current rounded-full mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant={workflow.disabled ? "outline" : "default"}
                      onClick={workflow.action}
                      disabled={workflow.disabled}
                    >
                      {workflow.disabled ? (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {workflow.disabledReason}
                        </>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {recentResumes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Your Resumes</h2>
              <Button variant="outline" onClick={() => router.push('/resumes')}>
                <Settings className="mr-2 h-4 w-4" />
                Manage All
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {recentResumes.map((resume) => (
                <Card key={resume.id} className={`${resume.is_default ? 'border-primary' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium truncate">
                        {resume.title}
                      </CardTitle>
                      {resume.is_default && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-xs text-muted-foreground">
                      {resume.is_parsed ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          Ready to use
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1 text-amber-500" />
                          Processing...
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
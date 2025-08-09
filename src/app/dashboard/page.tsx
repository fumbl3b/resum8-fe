'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  Target, 
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Settings,
  Briefcase,
  FolderOpen
} from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

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

  const quickActions = [
    {
      title: 'Analyze Resume',
      description: 'Upload and analyze your resume for strengths and weaknesses',
      icon: FileText,
      href: '/analyze-resume',
      color: 'bg-blue-500',
      completed: false
    },
    {
      title: 'Job Application Flow', 
      description: 'Optimize your resume for a specific job posting',
      icon: Briefcase,
      href: '/job-application',
      color: 'bg-purple-500',
      completed: false
    },
    {
      title: 'Generate PDF',
      description: 'Create professional LaTeX formatted resume',
      icon: Download,
      href: '/generate',
      color: 'bg-green-500',
      completed: false
    },
    {
      title: 'Resume Library',
      description: 'View and manage all your generated resumes',
      icon: FolderOpen,
      href: '/resume-library',
      color: 'bg-orange-500',
      completed: false
    }
  ];

  const recentActivity = [
    {
      action: 'Resume uploaded',
      timestamp: '2 hours ago',
      status: 'completed',
      description: 'Software Engineer Resume.pdf'
    },
    {
      action: 'Job analysis completed',
      timestamp: '1 hour ago', 
      status: 'completed',
      description: 'Senior Frontend Developer at Google'
    },
    {
      action: 'Resume optimized',
      timestamp: '45 minutes ago',
      status: 'completed', 
      description: '8 suggestions applied'
    },
    {
      action: 'LaTeX resume generated',
      timestamp: '30 minutes ago',
      status: 'completed',
      description: 'Professional template used'
    }
  ];

  const stats = [
    {
      label: 'Resumes Processed',
      value: '3',
      icon: FileText,
      change: '+1 this week'
    },
    {
      label: 'Jobs Analyzed', 
      value: '5',
      icon: Target,
      change: '+2 this week'
    },
    {
      label: 'Avg. Match Score',
      value: '87%',
      icon: BarChart3,
      change: '+12% improvement'
    },
    {
      label: 'Time Saved',
      value: '4.5h',
      icon: Clock,
      change: 'vs manual editing'
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-8 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {user?.email?.split('@')[0]}! 👋
                </h1>
                <p className="text-muted-foreground">
                  Ready to optimize more resumes and land your next opportunity?
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-green-600">{stat.change}</p>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Jump back into optimizing your resume
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(action.href)}
                  >
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-4`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    {action.completed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary ml-2 transition-colors" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest resume optimization activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">
                            {activity.action}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {activity.timestamp}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="mt-8 bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready for your next optimization?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Upload a new resume and job description to get AI-powered recommendations 
                that will help you stand out from the competition.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="px-8 py-3"
                  onClick={() => router.push('/upload')}
                >
                  Start New Optimization
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-3"
                  onClick={() => router.push('/demo')}
                >
                  View Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
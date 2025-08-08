'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Zap, 
  Target, 
  CheckCircle, 
  TrendingUp,
  Users,
  Clock,
  Star,
  FileText,
  Brain,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  // Auto-redirect returning users (A-2)
  useEffect(() => {
    const hasActiveSession = localStorage.getItem('resum8_user_session');
    if (hasActiveSession) {
      router.push('/upload'); // Redirect to dashboard/main app
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-20">
        <div className="text-center max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Resume Intelligence
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Land Your 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600"> Dream Job</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
            Transform your resume with AI-powered optimization that matches job descriptions and 
            <strong className="text-foreground"> increases interview chances by 3x</strong>
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>10,000+ resumes optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>85% more interviews</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>5-minute optimization</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => router.push('/signup')}
            >
              Start Free Optimization
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg font-medium border-2 hover:bg-accent/50"
              onClick={() => router.push('/demo')}
            >
              See Demo
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="px-8 py-4 text-lg"
              onClick={() => router.push('/login')}
            >
              Log In
            </Button>
          </div>

          {/* Benefits Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Smart Job Analysis</CardTitle>
                <CardDescription className="text-base">
                  AI extracts keywords, requirements, and hidden patterns from any job posting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Identifies critical keywords
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Analyzes company culture fit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Extracts skill requirements
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">AI-Powered Optimization</CardTitle>
                <CardDescription className="text-base">
                  Get personalized suggestions that dramatically improve your match score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Tailored recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ATS-friendly formatting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Impact quantification
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Professional Output</CardTitle>
                <CardDescription className="text-base">
                  Generate stunning LaTeX resumes that stand out from the competition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Professional LaTeX formatting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Instant PDF generation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Multiple template options
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="bg-accent/30 rounded-2xl p-8 mb-20">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="ml-2 text-sm font-medium">4.9/5 from 2,000+ users</span>
            </div>
            <blockquote className="text-lg italic text-center mb-4">
              "Resum8 helped me land 3 interviews in just one week. The AI suggestions were spot-on and the LaTeX output looked incredibly professional."
            </blockquote>
            <cite className="text-sm text-muted-foreground">
              — Sarah Chen, Software Engineer at Google
            </cite>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Why Choose Resum8?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>ATS-Optimized:</strong> Pass through Applicant Tracking Systems with keyword optimization
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Industry-Specific:</strong> Tailored suggestions for your field and role level
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Data-Driven:</strong> Based on analysis of 100,000+ successful job applications
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Privacy-First:</strong> Your data is secure and never shared with third parties
                  </div>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Proven Results
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-primary">3x</div>
                  <div className="text-sm text-muted-foreground">More Interviews</div>
                </div>
                <div className="bg-green-500/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">85%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">5min</div>
                  <div className="text-sm text-muted-foreground">Average Time</div>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">95%</div>
                  <div className="text-sm text-muted-foreground">ATS Pass Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <Card className="bg-gradient-to-r from-primary to-blue-600 text-white border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Career?</h3>
              <p className="text-lg mb-6 opacity-90">
                Join thousands of professionals who've boosted their interview success with Resum8
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                className="px-8 py-3 text-lg font-semibold"
                onClick={() => router.push('/signup')}
              >
                Start Your Free Optimization
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm mt-4 opacity-75">No credit card required • 5-minute setup</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
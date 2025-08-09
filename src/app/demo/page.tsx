'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function Demo() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-8 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="w-4 h-4 mr-2" />
              Live Demo
            </Badge>
            <h1 className="text-4xl font-bold mb-4">See Resum8 in Action</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Watch how our AI analyzes a real job posting and provides targeted resume optimization suggestions
            </p>
          </div>
        </div>

        {/* Sample Job Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Job Analysis Results
            </CardTitle>
            <CardDescription>
              Key requirements extracted from: &quot;Senior Software Engineer - React/Node.js&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>React</Badge>
                  <Badge>Node.js</Badge>
                  <Badge>TypeScript</Badge>
                  <Badge>API Development</Badge>
                  <Badge>AWS</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Experience Level</h4>
                <p className="text-sm text-muted-foreground">5+ years in full-stack development</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Optimization Suggestions */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Optimization Suggestions</h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-700">High Impact</h4>
                  <p className="text-sm mb-2">Add &quot;TypeScript&quot; to your technical skills section</p>
                  <p className="text-xs text-muted-foreground">
                    This job specifically requires TypeScript experience, and adding it will significantly improve your match score.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-700">Medium Impact</h4>
                  <p className="text-sm mb-2">Highlight your API development experience</p>
                  <p className="text-xs text-muted-foreground">
                    Consider adding specific examples of RESTful APIs or GraphQL implementations you&apos;ve worked on.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-700">Enhancement</h4>
                  <p className="text-sm mb-2">Quantify your React project achievements</p>
                  <p className="text-xs text-muted-foreground">
                    Add metrics like &quot;Improved application performance by 40%&quot; or &quot;Built React components used by 10,000+ users.&quot;
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-2">Ready to optimize your resume?</h3>
            <p className="text-muted-foreground mb-4">
              Sign up to upload your resume and get personalized optimization suggestions
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/signup')}>
                Create Free Account
              </Button>
              <Button variant="outline" onClick={() => router.push('/login')}>
                I have an account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
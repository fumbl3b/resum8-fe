'use client';

import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Target, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { currentStep, setCurrentStep } = useAppStore();
  
  const steps = [
    {
      id: 'upload',
      title: 'Upload Resume',
      description: 'Upload your resume and paste the job description',
      icon: Upload,
      completed: false,
    },
    {
      id: 'analyze',
      title: 'Analyze Job',
      description: 'AI analyzes the job description for keywords and requirements',
      icon: Target,
      completed: false,
    },
    {
      id: 'optimize',
      title: 'Optimize Resume',
      description: 'Get AI-powered suggestions to improve your resume',
      icon: FileText,
      completed: false,
    },
    {
      id: 'generate',
      title: 'Generate PDF',
      description: 'Generate a professionally formatted LaTeX resume',
      icon: Download,
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Resum8
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered resume optimization that matches job descriptions and increases your interview chances
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              
              return (
                <Card 
                  key={step.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    isActive ? 'ring-2 ring-primary bg-accent/50' : 'hover:shadow-md hover:shadow-primary/20'
                  }`}
                  onClick={() => {
                    setCurrentStep(step.id as any);
                    router.push(`/${step.id}`);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Ready to optimize your resume? Click on the Upload Resume step above to begin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => {
                    setCurrentStep('upload');
                    router.push('/upload');
                  }}
                  size="lg"
                  className="flex-1"
                >
                  Start Optimizing
                </Button>
                <Button variant="outline" size="lg" className="flex-1">
                  View Demo
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              How Resum8 Works
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mb-2">
                  <span className="font-semibold text-accent-foreground">1</span>
                </div>
                <p>Upload your resume and job description</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mb-2">
                  <span className="font-semibold text-accent-foreground">2</span>
                </div>
                <p>AI analyzes job requirements</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mb-2">
                  <span className="font-semibold text-accent-foreground">3</span>
                </div>
                <p>Get personalized optimization suggestions</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mb-2">
                  <span className="font-semibold text-accent-foreground">4</span>
                </div>
                <p>Download professional LaTeX resume</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
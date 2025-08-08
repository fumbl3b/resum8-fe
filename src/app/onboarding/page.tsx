'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Resum8!</h1>
      <p className="text-xl text-muted-foreground mb-8">
        To get started, please upload your default resume.
      </p>
      <Button size="lg" onClick={() => router.push('/resumes/upload')}>
        Upload Your Resume
      </Button>
    </div>
  );
}

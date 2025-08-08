'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { ResumeDocument } from '@/lib/types';

interface ChooseInputsStepProps {
  onNext: (comparisonType: string, altResumeId?: number, jobDescription?: string) => void;
}

export function ChooseInputsStep({ onNext }: ChooseInputsStepProps) {
  const [comparisonType, setComparisonType] = useState('default-only');
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [altResumeId, setAltResumeId] = useState<number | undefined>();
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    const fetchResumes = async () => {
      const data = await apiClient.getResumes();
      setResumes(data);
    };

    if (comparisonType === 'default-vs-another') {
      fetchResumes();
    }
  }, [comparisonType]);

  const handleNext = () => {
    onNext(comparisonType, altResumeId, jobDescription);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Choose Comparison Type</h3>
        <RadioGroup value={comparisonType} onValueChange={setComparisonType} className="mt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default-only" id="default-only" />
            <Label htmlFor="default-only">Improve my default resume</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default-vs-another" id="default-vs-another" />
            <Label htmlFor="default-vs-another">Compare my default resume to another</Label>
          </div>
        </RadioGroup>
      </div>

      {comparisonType === 'default-vs-another' && (
        <div>
          <h3 className="text-lg font-medium">Select Alternative Resume</h3>
          <Select onValueChange={(value) => setAltResumeId(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a resume" />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((resume) => (
                <SelectItem key={resume.id} value={String(resume.id)}>
                  {resume.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium">Job Description (Optional)</h3>
        <Textarea 
          placeholder="Paste the job description here..." 
          rows={10} 
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      <Button onClick={handleNext}>Start Comparison</Button>
    </div>
  );
}

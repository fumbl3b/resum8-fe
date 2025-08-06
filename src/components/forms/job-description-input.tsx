'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/app-store';

export function JobDescriptionInput() {
  const { jobDescription, setJobDescription } = useAppStore();
  const [localValue, setLocalValue] = useState(jobDescription);

  const handleSave = () => {
    setJobDescription(localValue);
  };

  const handleClear = () => {
    setLocalValue('');
    setJobDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Description</CardTitle>
        <CardDescription>
          Paste the job description you want to optimize your resume for
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste the job description here..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="min-h-[200px]"
        />
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!localValue.trim()}>
            Save Description
          </Button>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        </div>
        {jobDescription && (
          <div className="text-sm text-success">
            ✓ Job description saved ({jobDescription.length} characters)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
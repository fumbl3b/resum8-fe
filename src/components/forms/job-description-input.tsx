'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/app-store';

export function JobDescriptionInput() {
  const { jobDescription, setJobDescription } = useAppStore();
  const [localValue, setLocalValue] = useState(jobDescription);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Auto-save after user stops typing for 1 second
  useEffect(() => {
    if (localValue.trim() && localValue.trim() !== jobDescription.trim()) {
      setIsAutoSaving(true);
    }

    const timer = setTimeout(() => {
      if (localValue.trim() && localValue.trim() !== jobDescription.trim()) {
        setJobDescription(localValue.trim());
        setIsAutoSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [localValue, jobDescription, setJobDescription]);

  const handleSave = () => {
    setJobDescription(localValue.trim());
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
          Paste the job description you want to optimize your resume for (auto-saves as you type)
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
          <Button onClick={handleSave} disabled={!localValue.trim() || localValue.trim() === jobDescription.trim()}>
            Save Now
          </Button>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        </div>
        
        {isAutoSaving && (
          <div className="text-sm text-blue-600">
            Saving...
          </div>
        )}
        
        {jobDescription && !isAutoSaving && (
          <div className="text-sm text-green-600">
            ✓ Job description saved ({jobDescription.length} characters)
          </div>
        )}
        
        {!jobDescription && !isAutoSaving && localValue.trim() && (
          <div className="text-sm text-gray-500">
            Will auto-save in 1 second...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
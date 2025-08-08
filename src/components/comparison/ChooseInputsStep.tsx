'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ChooseInputsStepProps {
  onNext: () => void;
}

export function ChooseInputsStep({ onNext }: ChooseInputsStepProps) {
  const [comparisonType, setComparisonType] = useState('default-only');

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
          {/* Add resume selection dropdown here */}
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium">Job Description (Optional)</h3>
        <Textarea placeholder="Paste the job description here..." rows={10} />
      </div>

      <Button onClick={onNext}>Start Comparison</Button>
    </div>
  );
}

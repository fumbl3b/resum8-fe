'use client';

import { CheckCircle, Loader, Circle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StepperProps {
  steps: { name: string; status: string }[];
}

const stepLabels: Record<string, string> = {
  'parse_base': 'Parse Base Resume',
  'parse_alt': 'Parse Alt Resume',
  'analyze': 'Analyze',
  'suggest': 'Generate Suggestions',
  'rewrite': 'Rewrite',
  'diff': 'Create Diff',
  'latex': 'Generate LaTeX',
  'pdf': 'Create PDF'
};

export function Stepper({ steps }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const stepLabel = stepLabels[step.name] || step.name;

          return (
            <div key={step.name} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 mb-2">
                  {step.status === 'DONE' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : step.status === 'RUNNING' ? (
                    <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : step.status === 'ERROR' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{stepLabel}</p>
                  <Badge
                    variant={
                      step.status === 'DONE' ? 'default' :
                      step.status === 'RUNNING' ? 'secondary' :
                      step.status === 'ERROR' ? 'destructive' :
                      'outline'
                    }
                    className="text-xs mt-1"
                  >
                    {step.status}
                  </Badge>
                </div>
              </div>
              {!isLast && (
                <div className="w-12 h-0.5 bg-gray-200 mx-2 mt-[-20px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

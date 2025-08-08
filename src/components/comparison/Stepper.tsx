'use client';

import { CheckCircle, Loader } from 'lucide-react';

interface StepperProps {
  steps: { name: string; status: string }[];
}

export function Stepper({ steps }: StepperProps) {
  return (
    <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 sm:text-base">
      {steps.map((step, index) => (
        <li
          key={step.name}
          className="flex md:w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700"
        >
          <span className="flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500">
            {step.status === 'DONE' ? (
              <CheckCircle className="w-4 h-4 mr-2 sm:w-5 sm:h-5 text-green-500" />
            ) : step.status === 'RUNNING' ? (
              <Loader className="w-4 h-4 mr-2 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <span className="mr-2">{index + 1}</span>
            )}
            {step.name}
          </span>
        </li>
      ))}
    </ol>
  );
}

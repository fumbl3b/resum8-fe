'use client';

import { ComparisonWizard } from '@/components/comparison/ComparisonWizard';

export default function ComparePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Start a New Comparison</h1>
      <ComparisonWizard />
    </div>
  );
}

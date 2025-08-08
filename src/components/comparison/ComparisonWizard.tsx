'use client';

import { useState } from 'react';
import { ChooseInputsStep } from './ChooseInputsStep';

export function ComparisonWizard() {
  const [step, setStep] = useState(1);

  return (
    <div>
      {step === 1 && <ChooseInputsStep onNext={() => setStep(2)} />}
      {/* Add other steps here */}
    </div>
  );
}

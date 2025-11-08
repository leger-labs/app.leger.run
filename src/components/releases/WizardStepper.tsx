/**
 * Wizard Stepper Component
 * Visual progress indicator for the Release Wizard
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  description: string;
}

interface WizardStepperProps {
  currentStep: number;
  steps: Step[];
}

export function WizardStepper({ currentStep, steps }: WizardStepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <li
              key={step.label}
              className={cn(
                'relative flex-1',
                index !== steps.length - 1 && 'after:content-[""] after:absolute after:top-4 after:left-[calc(50%+1rem)] after:w-[calc(100%-2rem)] after:h-0.5',
                isCompleted && 'after:bg-primary',
                !isCompleted && 'after:bg-muted'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                {/* Step circle */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    isPending && 'border-muted bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-primary',
                      !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

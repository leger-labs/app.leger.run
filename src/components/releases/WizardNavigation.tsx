/**
 * Wizard Navigation Component
 * Previous/Next buttons for the Release Wizard
 */

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  canGoBack,
  canGoNext,
  isLastStep,
  onPrevious,
  onNext,
  onComplete,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoBack}
        type="button"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>

      <div className="text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </div>

      {isLastStep ? (
        <Button onClick={onComplete} disabled={!canGoNext} type="button">
          Complete Configuration
          <Check className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button onClick={onNext} disabled={!canGoNext} type="button">
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
}

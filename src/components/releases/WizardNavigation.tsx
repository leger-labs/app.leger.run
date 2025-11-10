/**
 * Wizard Navigation Component
 * Previous/Next buttons for the Release Wizard
 */

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const getDisabledTooltip = () => {
    if (canGoNext) return null;

    switch (currentStep) {
      case 1:
        return 'Select at least one model to continue';
      case 3:
        return 'WebUI Name is required to continue';
      case 4:
        return 'Fix duplicate subdomains before completing';
      default:
        return 'Complete required fields to continue';
    }
  };

  const nextButton = isLastStep ? (
    <Button onClick={onComplete} disabled={!canGoNext} type="button">
      Complete Configuration
      <Check className="h-4 w-4 ml-2" />
    </Button>
  ) : (
    <Button onClick={onNext} disabled={!canGoNext} type="button">
      Next
      <ChevronRight className="h-4 w-4 ml-2" />
    </Button>
  );

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

      {!canGoNext ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{nextButton}</TooltipTrigger>
            <TooltipContent>
              <p>{getDisabledTooltip()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        nextButton
      )}
    </div>
  );
}

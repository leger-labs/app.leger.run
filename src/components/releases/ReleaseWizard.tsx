/**
 * Release Wizard Component
 * 4-step wizard for configuring a release
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { WizardStepper } from './WizardStepper';
import { WizardNavigation } from './WizardNavigation';
import { ValidationSummary, type ValidationIssue } from './ValidationSummary';
import { ModelSelectionStep } from './steps/ModelSelectionStep';
import { ServiceSelectionStep } from './steps/ServiceSelectionStep';
import { OpenWebUIConfigStep } from './steps/OpenWebUIConfigStep';
import { CaddyRoutesStep } from './steps/CaddyRoutesStep';
import { apiClient } from '@/lib/api-client';
import type { CrystallizedConfig } from '@/types/release-wizard';

interface ReleaseWizardProps {
  releaseId?: string;
  onComplete: (config: CrystallizedConfig) => void;
}

const WIZARD_STEPS = [
  {
    label: 'Models',
    description: 'Select LLM models',
  },
  {
    label: 'Services',
    description: 'Choose providers',
  },
  {
    label: 'OpenWebUI',
    description: 'Configure settings',
  },
  {
    label: 'Routes',
    description: 'Setup Caddy',
  },
];

export function ReleaseWizard({ releaseId, onComplete }: ReleaseWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<Partial<CrystallizedConfig>>({
    models: { selected: [] },
    services: {
      rag: null,
      'web-search': null,
      stt: null,
      tts: null,
      'image-generation': null,
      'code-execution': null,
    },
    openwebui: {},
    caddy: { routes: [] },
  });

  // Load existing config if editing
  useEffect(() => {
    if (releaseId) {
      const loadConfig = async () => {
        try {
          const savedConfig = await apiClient.getReleaseConfig(releaseId);
          if (savedConfig) {
            setConfig(savedConfig);
          }
        } catch (error) {
          console.error('Failed to load release config:', error);
        }
      };
      loadConfig();
    }
  }, [releaseId]);

  // Auto-save draft config as user progresses
  useEffect(() => {
    const saveDraft = async () => {
      if (releaseId && Object.keys(config).length > 0) {
        try {
          await apiClient.saveReleaseConfig(releaseId, config as CrystallizedConfig);
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }
    };

    // Debounce auto-save
    const timeoutId = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeoutId);
  }, [config, releaseId]);

  const handleStepUpdate = useCallback((stepData: Partial<CrystallizedConfig>) => {
    setConfig((prev) => ({ ...prev, ...stepData }));
  }, []);

  // Get validation issues for the current step (returns issues, not boolean)
  const getValidationIssues = (step: number): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    switch (step) {
      case 1: // Model Selection
        if (!config.models?.selected || config.models.selected.length === 0) {
          issues.push({
            field: 'Models',
            message: 'Select at least one model to continue',
            severity: 'error',
          });
        }
        break;

      case 2: // Service Selection
        // All features either disabled (null) or have a provider selected
        // No validation needed - null is valid
        break;

      case 3: // OpenWebUI Config
        if (!config.openwebui?.WEBUI_NAME || config.openwebui.WEBUI_NAME.trim() === '') {
          issues.push({
            field: 'WebUI Name',
            message: 'A name for your OpenWebUI instance is required',
            severity: 'error',
          });
        }
        break;

      case 4: // Caddy Routes
        const routes = config.caddy?.routes || [];
        const enabledRoutes = routes.filter((r) => r.enabled);
        const subdomains = enabledRoutes.map((r) => r.subdomain);
        const duplicates = subdomains.filter((s, i) => subdomains.indexOf(s) !== i);

        if (duplicates.length > 0) {
          issues.push({
            field: 'Subdomains',
            message: `Duplicate subdomains detected: ${duplicates.join(', ')}`,
            severity: 'error',
          });
        }

        if (enabledRoutes.length === 0) {
          issues.push({
            field: 'Routes',
            message: 'No routes are enabled. Enable at least one service route.',
            severity: 'warning',
          });
        }
        break;
    }

    return issues;
  };

  // Check if step can proceed (for backward compatibility with old code)
  const validateStep = (step: number): boolean => {
    const issues = getValidationIssues(step);
    const errors = issues.filter((i) => i.severity === 'error');

    if (errors.length > 0) {
      // Show first error as toast (for now)
      toast.error(errors[0].message);
      return false;
    }

    return true;
  };

  // Check if we can proceed from current step (without showing toasts)
  const canProceedFromStep = (step: number): boolean => {
    const issues = getValidationIssues(step);
    return issues.filter((i) => i.severity === 'error').length === 0;
  };

  // Get current step validation issues
  const currentStepIssues = useMemo(() => {
    return getValidationIssues(currentStep);
  }, [currentStep, config]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Final validation
    if (!config.models?.selected || config.models.selected.length === 0) {
      toast.error('Please select at least one model');
      setCurrentStep(1);
      return;
    }

    if (!config.openwebui?.WEBUI_NAME || config.openwebui.WEBUI_NAME.trim() === '') {
      toast.error('WebUI Name is required');
      setCurrentStep(3);
      return;
    }

    onComplete(config as CrystallizedConfig);
  };

  const canGoBack = currentStep > 1;
  const canGoNext = canProceedFromStep(currentStep);
  const isLastStep = currentStep === WIZARD_STEPS.length;
  const canProceed = canProceedFromStep(currentStep);

  return (
    <div className="space-y-6">
      {/* Stepper UI */}
      <WizardStepper currentStep={currentStep} steps={WIZARD_STEPS} />

      {/* Step Content */}
      <div className="min-h-[400px] space-y-6">
        {currentStep === 1 && (
          <ModelSelectionStep config={config} onUpdate={handleStepUpdate} />
        )}

        {currentStep === 2 && (
          <ServiceSelectionStep config={config} onUpdate={handleStepUpdate} />
        )}

        {currentStep === 3 && (
          <OpenWebUIConfigStep config={config} onUpdate={handleStepUpdate} />
        )}

        {currentStep === 4 && (
          <CaddyRoutesStep config={config} onUpdate={handleStepUpdate} />
        )}

        {/* Validation Summary */}
        <ValidationSummary
          issues={currentStepIssues}
          canProceed={canProceed}
          stepName={WIZARD_STEPS[currentStep - 1].label}
        />
      </div>

      {/* Navigation */}
      <WizardNavigation
        currentStep={currentStep}
        totalSteps={WIZARD_STEPS.length}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        isLastStep={isLastStep}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onComplete={handleComplete}
      />
    </div>
  );
}

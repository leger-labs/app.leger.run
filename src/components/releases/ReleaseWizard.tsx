/**
 * Release Wizard Component
 * 4-step wizard for configuring a release
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { WizardStepper } from './WizardStepper';
import { WizardNavigation } from './WizardNavigation';
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Model Selection
        if (!config.models?.selected || config.models.selected.length === 0) {
          toast.error('Please select at least one model');
          return false;
        }
        return true;

      case 2: // Service Selection
        // All features either disabled (null) or have a provider selected
        // No validation needed - null is valid
        return true;

      case 3: // OpenWebUI Config
        const required = ['WEBUI_NAME', 'TASK_MODEL'];
        for (const field of required) {
          if (!config.openwebui?.[field]) {
            toast.error(`${field} is required`);
            return false;
          }
        }
        return true;

      case 4: // Caddy Routes
        const routes = config.caddy?.routes || [];
        const subdomains = routes.filter((r) => r.enabled).map((r) => r.subdomain);
        const duplicates = subdomains.filter((s, i) => subdomains.indexOf(s) !== i);

        if (duplicates.length > 0) {
          toast.error(`Duplicate subdomains: ${duplicates.join(', ')}`);
          return false;
        }
        return true;

      default:
        return true;
    }
  };

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

    if (!config.openwebui?.WEBUI_NAME || !config.openwebui?.TASK_MODEL) {
      toast.error('Required OpenWebUI configuration missing');
      setCurrentStep(3);
      return;
    }

    onComplete(config as CrystallizedConfig);
  };

  const canGoBack = currentStep > 1;
  const canGoNext = validateStep(currentStep);
  const isLastStep = currentStep === WIZARD_STEPS.length;

  return (
    <div className="space-y-6">
      {/* Stepper UI */}
      <WizardStepper currentStep={currentStep} steps={WIZARD_STEPS} />

      {/* Step Content */}
      <div className="min-h-[400px]">
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

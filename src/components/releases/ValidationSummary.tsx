/**
 * Validation Summary Component
 * Shows validation status and requirements for wizard steps
 */

import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationSummaryProps {
  issues: ValidationIssue[];
  canProceed: boolean;
  stepName?: string;
}

export function ValidationSummary({ issues, canProceed, stepName }: ValidationSummaryProps) {
  if (issues.length === 0 && canProceed) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">Ready to proceed</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          {stepName ? `${stepName} is complete.` : 'This step is complete.'} Click Next to continue.
        </AlertDescription>
      </Alert>
    );
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Required fields missing</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {errors.map((issue, idx) => (
                <li key={idx}>
                  <span className="font-medium">{issue.field}:</span> {issue.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Recommendations</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <ul className="mt-2 list-disc list-inside space-y-1">
              {warnings.map((issue, idx) => (
                <li key={idx}>
                  <span className="font-medium">{issue.field}:</span> {issue.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {infos.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {infos.map((issue, idx) => (
                <li key={idx}>
                  <span className="font-medium">{issue.field}:</span> {issue.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

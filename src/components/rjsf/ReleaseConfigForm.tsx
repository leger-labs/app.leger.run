/**
 * Release Configuration Form
 * RJSF-based form with progressive disclosure
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { customWidgets } from './widgets';
import { customTemplates } from './templates';

interface ReleaseConfigFormProps {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData?: any;
  onChange?: (data: any) => void;
  onSubmit?: (data: any) => void;
  onError?: (errors: any) => void;
  formContext?: Record<string, unknown>;
}

/**
 * Check if a field's dependencies are met
 */
function checkDependencies(
  dependencies: Array<{ path: string[]; value: any }>,
  formData: any
): boolean {
  if (!dependencies || dependencies.length === 0) {
    return true;
  }

  return dependencies.every((dep) => {
    let current = formData;
    for (const key of dep.path) {
      if (current === undefined || current === null) {
        return false;
      }
      current = current[key];
    }
    return current === dep.value;
  });
}

/**
 * Apply progressive disclosure rules to uiSchema
 */
function applyProgressiveDisclosure(
  uiSchema: UiSchema | undefined,
  formData: any
): UiSchema {
  if (!uiSchema) {
    return {};
  }

  const processedUiSchema: UiSchema = {};

  Object.entries(uiSchema).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      const dependencies = value['ui:dependencies'];

      if (dependencies) {
        // Check if dependencies are met
        const visible = checkDependencies(dependencies, formData);

        if (!visible) {
          // Hide field by setting ui:widget to hidden
          processedUiSchema[key] = {
            ...value,
            'ui:widget': 'hidden',
          };
          return;
        }
      }

      // Recursively process nested uiSchemas
      if (value['ui:field'] === 'object' || (value as any).properties) {
        processedUiSchema[key] = applyProgressiveDisclosure(value, formData);
      } else {
        processedUiSchema[key] = value;
      }
    } else {
      processedUiSchema[key] = value;
    }
  });

  return processedUiSchema;
}

export function ReleaseConfigForm({
  schema,
  uiSchema,
  formData: initialFormData,
  onChange,
  onSubmit,
  onError,
  formContext,
}: ReleaseConfigFormProps) {
  const [formData, setFormData] = useState(initialFormData || {});

  useEffect(() => {
    setFormData(initialFormData || {});
  }, [initialFormData]);

  // Apply progressive disclosure based on current form data
  const processedUiSchema = useMemo(() => {
    return applyProgressiveDisclosure(uiSchema, formData);
  }, [uiSchema, formData]);

  const handleChange = useCallback(
    (event: IChangeEvent<any, RJSFSchema>) => {
      const newFormData = event.formData;
      setFormData(newFormData);
      onChange?.(newFormData as Record<string, unknown>);
    },
    [onChange]
  );

  const handleSubmit = useCallback(
    (event: IChangeEvent<any, RJSFSchema>) => {
      onSubmit?.(event.formData as Record<string, unknown>);
    },
    [onSubmit]
  );

  const handleError = useCallback(
    (errors: any) => {
      onError?.(errors);
    },
    [onError]
  );

  return (
    <Form
      schema={schema}
      uiSchema={processedUiSchema}
      formData={formData}
      validator={validator}
      widgets={customWidgets}
      templates={customTemplates}
      formContext={formContext}
      onChange={(event) => handleChange(event)}
      onSubmit={(event) => handleSubmit(event)}
      onError={handleError}
      showErrorList={false}
      noHtml5Validate={true}
      liveValidate={false}
    >
      {/* Hide default submit button - we'll use custom buttons */}
      <button type="submit" className="hidden" />
    </Form>
  );
}

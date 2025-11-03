/**
 * RJSF Field Template
 * Controls the layout and rendering of individual fields
 */

import { FieldTemplateProps } from '@rjsf/utils';
import { cn } from '@/lib/utils';

export function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    children,
    classNames,
    disabled,
    displayLabel,
    hidden,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    required,
    rawErrors = [],
    rawHelp,
    rawDescription,
    schema,
    uiSchema,
  } = props;

  // Handle conditional visibility based on x-depends-on
  const dependencies = uiSchema?.['ui:dependencies'];
  if (dependencies && Array.isArray(dependencies)) {
    // This would be implemented with form context to check dependencies
    // For now, we'll render everything and handle visibility at a higher level
  }

  if (hidden) {
    return null;
  }

  const hasErrors = rawErrors.length > 0;

  return (
    <div
      className={cn(
        'field-wrapper',
        classNames,
        'mb-4',
        hasErrors && 'field-error',
        disabled && 'opacity-50'
      )}
      data-field-id={id}
    >
      {children}
    </div>
  );
}

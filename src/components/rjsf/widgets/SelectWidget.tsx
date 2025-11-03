/**
 * RJSF Select Widget
 * Wraps our SelectField component for RJSF
 */

import { WidgetProps } from '@rjsf/utils';
import { SelectField } from '@/components/ui/form/fields/select-field';

export function SelectWidget(props: WidgetProps) {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    options,
    schema,
    uiSchema,
    rawErrors,
  } = props;

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  const error = rawErrors && rawErrors.length > 0 ? rawErrors[0] : undefined;

  // Get options from schema enum or uiSchema enumOptions
  const enumOptions =
    (uiSchema?.['ui:options'] as any)?.enumOptions ||
    (options.enumOptions as Array<{ value: string; label: string }>) ||
    [];

  return (
    <SelectField
      id={id}
      label={schema.title || props.label}
      description={schema.description || uiSchema?.['ui:description']}
      value={value || ''}
      onChange={handleChange}
      options={enumOptions}
      disabled={disabled || readonly}
      placeholder={uiSchema?.['ui:placeholder'] as string}
      error={error}
    />
  );
}

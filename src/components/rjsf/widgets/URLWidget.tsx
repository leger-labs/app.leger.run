/**
 * RJSF URL Widget
 * Wraps our URLInput component for RJSF
 */

import { WidgetProps } from '@rjsf/utils';
import { URLInput } from '@/components/ui/form/fields/url-input';

export function URLWidget(props: WidgetProps) {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    uiSchema,
    rawErrors,
  } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value === '' ? options.emptyValue : e.target.value);
  };

  const error = rawErrors && rawErrors.length > 0 ? rawErrors[0] : undefined;

  return (
    <URLInput
      id={id}
      label={schema.title || props.label}
      description={schema.description || uiSchema?.['ui:description']}
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur && (() => onBlur(id, value))}
      onFocus={onFocus && (() => onFocus(id, value))}
      disabled={disabled || readonly}
      placeholder={uiSchema?.['ui:placeholder'] as string}
      error={error}
    />
  );
}

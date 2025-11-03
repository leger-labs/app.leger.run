/**
 * RJSF Text Widget
 * Wraps our TextField component for RJSF
 */

import { WidgetProps } from '@rjsf/utils';
import { TextField } from '@/components/ui/form/fields/text-field';

export function TextWidget(props: WidgetProps) {
  const {
    id,
    value,
    disabled,
    readonly,
    autofocus,
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
    <TextField
      id={id}
      label={schema.title || props.label}
      description={schema.description || uiSchema?.['ui:description']}
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur && (() => onBlur(id, value))}
      onFocus={onFocus && (() => onFocus(id, value))}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={uiSchema?.['ui:placeholder'] as string}
      maxLength={schema.maxLength}
      showCharCount={!!schema.maxLength}
      error={error}
    />
  );
}

/**
 * RJSF Textarea Widget
 * Wraps Textarea component for RJSF
 */

import { WidgetProps } from '@rjsf/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormDescription } from '@/components/ui/form';

export function TextareaWidget(props: WidgetProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value === '' ? options.emptyValue : e.target.value);
  };

  const error = rawErrors && rawErrors.length > 0 ? rawErrors[0] : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={error ? 'text-destructive' : ''}>
        {schema.title || props.label}
      </Label>
      <Textarea
        id={id}
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur && (() => onBlur(id, value))}
        onFocus={onFocus && (() => onFocus(id, value))}
        disabled={disabled || readonly}
        placeholder={uiSchema?.['ui:placeholder'] as string}
        rows={options.rows || 4}
        className={error ? 'border-destructive' : ''}
      />
      {schema.description && !error && (
        <FormDescription>{schema.description}</FormDescription>
      )}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

/**
 * RJSF Number Widget
 * Handles both integer and number types
 */

import { WidgetProps } from '@rjsf/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function NumberWidget(props: WidgetProps) {
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
    const newValue = e.target.value;

    if (newValue === '') {
      onChange(options.emptyValue);
      return;
    }

    const parsed =
      schema.type === 'integer' ? parseInt(newValue, 10) : parseFloat(newValue);

    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const error = rawErrors && rawErrors.length > 0 ? rawErrors[0] : undefined;
  const description =
    (schema.description || (uiSchema?.['ui:description'] as string | undefined)) ?? undefined;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={error ? 'text-destructive' : ''}>
        {schema.title || props.label}
      </Label>
      <Input
        id={id}
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        onBlur={onBlur && (() => onBlur(id, value))}
        onFocus={onFocus && (() => onFocus(id, value))}
        disabled={disabled || readonly}
        placeholder={uiSchema?.['ui:placeholder'] as string}
        min={schema.minimum}
        max={schema.maximum}
        step={schema.type === 'integer' ? 1 : 'any'}
        className={error ? 'border-destructive' : ''}
        aria-describedby={!error && descriptionId ? descriptionId : undefined}
      />
      {description && !error && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

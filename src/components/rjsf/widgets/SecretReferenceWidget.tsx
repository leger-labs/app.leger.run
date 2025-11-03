/**
 * RJSF Secret Reference Widget
 * Allows selecting managed secrets or entering {PLACEHOLDER} references
 */

import { useMemo, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { WidgetProps } from '@rjsf/utils';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSecrets } from '@/hooks/use-secrets';
import { cn } from '@/lib/utils';

function ensureSecretReference(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const withoutBraces = trimmed.replace(/^\{+/, '').replace(/\}+$/, '');
  if (!withoutBraces) {
    return '';
  }

  return `{${withoutBraces}}`;
}

function parseSecretName(reference?: string | null): string | undefined {
  if (!reference) {
    return undefined;
  }

  const match = reference.match(/^\{([^{}]+)\}$/);
  return match ? match[1] : undefined;
}

export function SecretReferenceWidget(props: WidgetProps) {
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
    label,
  } = props;

  const { secrets, isLoading } = useSecrets();

  const secretOptions = useMemo(
    () => secrets.map((secret) => secret.name).sort((a, b) => a.localeCompare(b)),
    [secrets],
  );

  const formattedValue = typeof value === 'string' ? value : '';
  const selectedSecret = parseSecretName(formattedValue);
  const error = rawErrors && rawErrors.length > 0 ? rawErrors[0] : undefined;

  const placeholder =
    (uiSchema?.['ui:placeholder'] as string | undefined) || '{SECRET_NAME}';
  const description = uiSchema?.['ui:description'] || schema.description;
  const helpText = uiSchema?.['ui:help'] as string | undefined;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    if (nextValue === '') {
      onChange(options.emptyValue ?? '');
      return;
    }

    const formatted = ensureSecretReference(nextValue);
    onChange(formatted);
  };

  const handleSelectChange = (next: string) => {
    if (next === '__clear__') {
      onChange(options.emptyValue ?? '');
      return;
    }

    const formatted = ensureSecretReference(next);
    onChange(formatted);
  };

  const showClearOption = formattedValue !== '';

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className={cn('text-sm font-medium', error && 'text-destructive')}
      >
        {schema.title || label}
      </Label>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          value={formattedValue}
          onChange={handleInputChange}
          onBlur={onBlur && (() => onBlur(id, formattedValue))}
          onFocus={onFocus && (() => onFocus(id, formattedValue))}
          placeholder={placeholder}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          className={cn('sm:flex-1', error && 'border-destructive focus-visible:ring-destructive')}
        />

        <Select
          value={selectedSecret ?? undefined}
          onValueChange={handleSelectChange}
          disabled={disabled || readonly || isLoading}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue
              placeholder={
                isLoading
                  ? 'Loading secrets…'
                  : secretOptions.length > 0
                    ? 'Select secret reference'
                    : 'No secrets available'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {secretOptions.length === 0 ? (
              <SelectItem value="__none__" disabled>
                {isLoading ? 'Loading secrets…' : 'No secrets available'}
              </SelectItem>
            ) : (
              secretOptions.map((secretName) => (
                <SelectItem key={secretName} value={secretName}>
                  {secretName}
                </SelectItem>
              ))
            )}
            {showClearOption && (
              <SelectItem value="__clear__">Clear selection</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        {helpText && (
          <p className="text-xs text-muted-foreground whitespace-pre-line">
            {helpText}
          </p>
        )}
        <Button
          asChild
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs"
        >
          <Link to="/api-keys">Manage secrets</Link>
        </Button>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

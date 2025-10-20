/**
 * RJSF Widget Adapters
 * 
 * Maps React JSON Schema Form widgets to existing shadcn components
 * Part of Task 017: RJSF Widget Adapter Implementation
 */

import React from 'react';
import type { WidgetProps } from '@rjsf/utils';

// Import existing shadcn components
import { TextField } from '@/components/ui/form/fields/text-field';
import { SecretField } from '@/components/ui/form/fields/secret-field';
import { ToggleField } from '@/components/ui/form/fields/toggle-field';
import { SelectField } from '@/components/ui/form/fields/select-field';
import { URLInput } from '@/components/ui/form/fields/url-input';
import { MarkdownTextArea } from '@/components/ui/form/fields/markdown-text-area';

/**
 * Text Widget - Maps to TextField component
 */
function TextWidget(props: WidgetProps) {
  const { 
    id, 
    value, 
    onChange, 
    onBlur,
    onFocus,
    label, 
    placeholder, 
    disabled, 
    readonly,
    schema,
    uiSchema,
    rawErrors
  } = props;

  const error = rawErrors?.[0];
  const maxLength = schema.maxLength;
  const showCharCount = uiSchema?.['ui:showCharCount'] || false;
  
  return (
    <TextField
      id={id}
      label={label || ''}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
      onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
      placeholder={placeholder}
      disabled={disabled || readonly}
      maxLength={maxLength}
      showCharCount={showCharCount}
      error={error}
      description={uiSchema?.['ui:help']}
    />
  );
}

/**
 * Password Widget - Maps to SecretField component  
 */
function PasswordWidget(props: WidgetProps) {
  const { 
    id, 
    value, 
    onChange, 
    onBlur,
    onFocus,
    label, 
    placeholder, 
    disabled, 
    readonly,
    uiSchema,
    rawErrors
  } = props;

  const error = rawErrors?.[0];
  
  return (
    <SecretField
      id={id}
      label={label || ''}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
      onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
      placeholder={placeholder}
      disabled={disabled || readonly}
      error={error}
      description={uiSchema?.['ui:help']}
    />
  );
}

/**
 * Checkbox Widget - Maps to ToggleField component
 */
function CheckboxWidget(props: WidgetProps) {
  const { 
    id, 
    value, 
    onChange, 
    label, 
    disabled, 
    readonly,
    uiSchema
  } = props;
  
  return (
    <ToggleField
      id={id}
      label={label || ''}
      checked={Boolean(value)}
      onCheckedChange={(checked) => onChange(checked)}
      disabled={disabled || readonly}
      description={uiSchema?.['ui:help']}
    />
  );
}

/**
 * Select Widget - Maps to SelectField component
 */
function SelectWidget(props: WidgetProps) {
  const { 
    id, 
    value, 
    onChange, 
    label, 
    placeholder,
    disabled, 
    readonly,
    options,
    uiSchema,
    rawErrors
  } = props;

  const error = rawErrors?.[0];
  
  // Convert RJSF options format to SelectField format
  const selectOptions = options.enumOptions?.map((option: any) => ({
    value: option.value,
    label: option.label
  })) || [];

  // Check for custom enumOptions in uiSchema
  const customOptions = uiSchema?.['ui:enumOptions'];
  if (customOptions && Array.isArray(customOptions)) {
    selectOptions.push(...customOptions);
  }
  
  return (
    <SelectField
      id={id}
      label={label || ''}
      value={value || ''}
      onChange={(newValue) => onChange(newValue)}
      options={selectOptions}
      placeholder={placeholder || 'Select an option'}
      disabled={disabled || readonly}
      error={error}
      description={uiSchema?.['ui:help']}
    />
  );
}

/**
 * URL Widget - Maps to URLInput component  
 */
function URLWidget(props: WidgetProps) {
  const { 
    id, 
    value, 
    onChange, 
    onBlur,
    onFocus,
    label, 
    placeholder, 
    disabled, 
    readonly,
    uiSchema,
    rawErrors
  } = props;

  const error = rawErrors?.[0];
  
  return (
    <URLInput
      id={id}
      label={label || ''}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
      onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
      placeholder={placeholder || 'https://example.com'}
      disabled={disabled || readonly}
      error={error}
      description={uiSchema?.['ui:help']}
    />
  );
}

/**
 * Textarea Widget - Maps to MarkdownTextArea component
 */
function TextareaWidget(props: WidgetProps) {
  const { 
    id, 
    value, 
    onChange, 
    onBlur,
    onFocus,
    label, 
    placeholder, 
    disabled, 
    readonly,
    schema,
    uiSchema,
    rawErrors
  } = props;

  const error = rawErrors?.[0];
  const maxLength = schema.maxLength;
  
  return (
    <MarkdownTextArea
      id={id}
      label={label || ''}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
      onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
      placeholder={placeholder}
      disabled={disabled || readonly}
      maxLength={maxLength}
      error={error}
      description={uiSchema?.['ui:help']}
    />
  );
}

/**
 * Hidden Widget - Renders nothing for hidden fields
 */
function HiddenWidget(props: WidgetProps) {
  const { value, onChange } = props;
  
  return (
    <input
      type="hidden"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Widget registry for RJSF
 */
export const widgets = {
  // Basic widgets
  TextWidget,
  PasswordWidget,
  CheckboxWidget,
  SelectWidget,
  TextareaWidget,
  URLWidget,
  HiddenWidget,
  
  // Alternative names for compatibility
  BaseInput: TextWidget,
  password: PasswordWidget,
  checkbox: CheckboxWidget,
  select: SelectWidget,
  textarea: TextareaWidget,
  url: URLWidget,
  hidden: HiddenWidget,
  NumberWidget: TextWidget,
  IntegerWidget: TextWidget,
  // ArrayWidget will be handled by ArrayFieldTemplate
};

export default widgets;
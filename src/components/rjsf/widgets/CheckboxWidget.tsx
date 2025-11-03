/**
 * RJSF Checkbox Widget
 * Wraps our ToggleField component for RJSF
 */

import { WidgetProps } from '@rjsf/utils';
import { ToggleField } from '@/components/ui/form/fields/toggle-field';

export function CheckboxWidget(props: WidgetProps) {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    schema,
    uiSchema,
  } = props;

  const handleChange = (checked: boolean) => {
    onChange(checked);
  };

  return (
    <ToggleField
      id={id}
      label={schema.title || props.label}
      description={schema.description || uiSchema?.['ui:description']}
      checked={value || false}
      onCheckedChange={handleChange}
      disabled={disabled || readonly}
    />
  );
}

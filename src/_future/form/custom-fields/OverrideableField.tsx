import React, { useState } from 'react'
import { FieldProps } from '@rjsf/utils'
import { OverrideableField } from '@/components/ui/form/wrappers/overrideable-field'

export default function OverrideableFieldWrapper(props: FieldProps) {
  const isOverrideable = props.uiSchema?.['ui:overrideable']
  const defaultValue = props.schema.default
  const [isOverridden, setIsOverridden] = useState(false)
  
  // If not overrideable, render the default field
  if (!isOverrideable) {
    const DefaultField = props.registry.fields.StringField || props.registry.fields.default
    return <DefaultField {...props} />
  }
  
  const handleOverride = (overridden: boolean) => {
    setIsOverridden(overridden)
    if (!overridden && defaultValue !== undefined) {
      // Reset to default value
      props.onChange(defaultValue)
    }
  }
  
  // Use the OverrideableField component with proper props
  return (
    <OverrideableField 
      label={props.schema.title || props.name}
      description={props.schema.description}
      defaultValue={String(defaultValue || '')}
      value={String(props.formData || '')}
      onChange={(value) => props.onChange(value)}
      overridden={isOverridden}
      onOverrideChange={handleOverride}
      id={props.idSchema.$id}
    />
  )
}
import React from 'react'
import { FieldProps } from '@rjsf/utils'
import { PlanRestrictedFeature } from '@/components/ui/form/wrappers/plan-restricted-feature'

export default function PlanRestrictedField(props: FieldProps) {
  const planRequired = props.uiSchema?.['ui:planRequired']
  
  // If no plan restriction, render the default field
  if (!planRequired) {
    const DefaultField = props.registry.fields.StringField || props.registry.fields.default
    return <DefaultField {...props} />
  }
  
  // Wrap the field with plan restriction
  return (
    <PlanRestrictedFeature 
      title={props.schema.title || props.name}
      _description={props.schema.description || ''}
      requiredPlan={planRequired as string}
      callToAction="Upgrade to access"
      onUpgradeClick={() => console.log('Upgrade clicked')}
    >
      {React.createElement(props.registry.fields.StringField || props.registry.fields.default, props)}
    </PlanRestrictedFeature>
  )
}
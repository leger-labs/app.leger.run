/**
 * Simple RJSF Field Template
 * 
 * Simplified field template to avoid component dependency issues
 * Part of Task 017: RJSF Widget Adapter Implementation
 */

import React from 'react';
import type { FieldTemplateProps } from '@rjsf/utils';

export default function SimpleFieldTemplate(props: FieldTemplateProps) {
  const { 
    id, 
    label, 
    required, 
    description, 
    children, 
    rawErrors, 
    schema, 
    uiSchema, 
    formData,
    hidden
  } = props;
  
  // Don't render anything for hidden fields
  if (hidden || uiSchema?.['ui:widget'] === 'hidden') {
    return <>{children}</>;
  }
  
  // Extract metadata from schema/uiSchema
  const maxLength = schema.maxLength;
  const showCharCount = uiSchema?.['ui:showCharCount'];
  const helpText = uiSchema?.['ui:help'] || description;
  
  return (
    <div className="space-y-2 mb-4">
      {label && (
        <div className="flex items-center gap-2">
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          {required && <span className="text-destructive">*</span>}
        </div>
      )}
      
      {helpText && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
      
      <div className="space-y-2">
        {children}
        
        {/* Character counter */}
        {showCharCount && maxLength && typeof formData === 'string' && (
          <div className="text-xs text-muted-foreground">
            {formData.length}/{maxLength} characters
          </div>
        )}
        
        {/* Error messages */}
        {rawErrors && rawErrors.length > 0 && (
          <div className="space-y-1">
            {rawErrors.map((error, index) => (
              <p key={index} className="text-sm text-destructive">{error}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
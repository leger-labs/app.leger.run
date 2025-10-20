/**
 * Simple RJSF Object Field Template
 * 
 * Simplified object template for basic category organization
 * Part of Task 017: RJSF Widget Adapter Implementation
 */

import React from 'react';
import type { ObjectFieldTemplateProps } from '@rjsf/utils';

export default function SimpleObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { 
    title, 
    description, 
    properties, 
    uiSchema
  } = props;
  
  // Handle empty properties
  if (!properties || properties.length === 0) {
    return null;
  }
  
  // Get custom title from uiSchema
  const displayTitle = uiSchema?.['ui:title'] || title;
  const helpText = uiSchema?.['ui:help'] || description;
  
  // Render with title if available
  if (displayTitle) {
    return (
      <div className="space-y-6 p-6 border rounded-lg bg-card">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{displayTitle}</h3>
          {helpText && (
            <p className="text-sm text-muted-foreground">{helpText}</p>
          )}
        </div>
        <div className="space-y-4">
          {properties.map((prop) => (
            <div key={prop.name}>
              {prop.content}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Simple object without title
  return (
    <div className="space-y-4">
      {properties.map((prop) => (
        <div key={prop.name}>
          {prop.content}
        </div>
      ))}
    </div>
  );
}
/**
 * Simple RJSF Array Field Template
 * 
 * Simplified array template for basic array handling
 * Part of Task 017: RJSF Widget Adapter Implementation
 */

import React from 'react';
import type { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

export default function SimpleArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { 
    title, 
    items, 
    canAdd, 
    onAddClick,
    disabled,
    readonly,
    uiSchema
  } = props;
  
  // Extract array options from uiSchema
  const arrayOptions = uiSchema?.['ui:arrayOptions'] || {};
  const addText = arrayOptions.addText || 'Add Item';
  
  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-base font-medium">{title}</h4>
      )}
      
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-start gap-2 p-3 border rounded-lg">
            <div className="flex-1">
              {item.children}
            </div>
            {item.hasRemove && !disabled && !readonly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(_e) => item.onDropIndexClick(item.index)}
                className="text-destructive hover:text-destructive/80"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {canAdd && !disabled && !readonly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddClick}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {addText}
        </Button>
      )}
    </div>
  );
}
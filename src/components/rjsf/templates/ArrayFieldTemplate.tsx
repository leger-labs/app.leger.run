/**
 * RJSF Array Field Template
 * Controls the layout of array fields
 */

import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { FormDescription } from '@/components/ui/form';

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const {
    canAdd,
    disabled,
    idSchema,
    items,
    onAddClick,
    readonly,
    required,
    schema,
    title,
    uiSchema,
  } = props;

  return (
    <div className="array-field space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>{title || schema.title}</Label>
          {schema.description && (
            <FormDescription>{schema.description}</FormDescription>
          )}
        </div>
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddClick}
            disabled={disabled || readonly}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((element) => (
          <div
            key={element.key}
            className="flex items-start gap-2 border rounded-lg p-4"
          >
            <div className="flex-1">{element.children}</div>
            <div className="flex gap-1">
              {element.hasMoveUp && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={element.onReorderClick(element.index, element.index - 1)}
                  disabled={disabled || readonly}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
              {element.hasMoveDown && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={element.onReorderClick(element.index, element.index + 1)}
                  disabled={disabled || readonly}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}
              {element.hasRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={element.onDropIndexClick(element.index)}
                  disabled={disabled || readonly}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            No items yet. Click "Add Item" to get started.
          </p>
        </div>
      )}
    </div>
  );
}

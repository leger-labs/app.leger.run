/**
 * Collapsible Field Group Component
 *
 * Groups related configuration fields with optional collapse/expand
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FieldGroup as FieldGroupType } from '@/lib/field-grouping';

interface FieldGroupProps {
  group: FieldGroupType;
  children: React.ReactNode;
  className?: string;
}

export function FieldGroup({ group, children, className }: FieldGroupProps) {
  const [isExpanded, setIsExpanded] = useState(group.defaultExpanded ?? true);

  if (!group.collapsible) {
    // Non-collapsible group - just render content
    return (
      <div className={cn('space-y-4', className)}>
        {group.label && group.label !== 'General Settings' && (
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">{group.label}</h3>
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>
        )}
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  // Collapsible group
  return (
    <Card className={cn('border-muted', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {group.label}
              {group.description && (
                <Info className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
            {group.description && (
              <CardDescription className="text-sm">
                {group.description}
              </CardDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Field Group List - renders multiple field groups
 */
interface FieldGroupListProps {
  groups: FieldGroupType[];
  renderFields: (fields: any[]) => React.ReactNode;
  className?: string;
}

export function FieldGroupList({ groups, renderFields, className }: FieldGroupListProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {groups.map((group) => (
        <FieldGroup key={group.id} group={group}>
          {renderFields(group.fields)}
        </FieldGroup>
      ))}
    </div>
  );
}

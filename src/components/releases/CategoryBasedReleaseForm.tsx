import { useCallback, useEffect, useMemo, useState } from 'react';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { HierarchicalNavigation } from '@/components/ui/navigation/hierarchical-navigation';
import { ReleaseConfigForm } from '@/components/rjsf/ReleaseConfigForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReleaseCategory } from '@/types/release-schema';

type NavigationStatus = 'complete' | 'error' | 'incomplete' | undefined;

interface CategoryBasedReleaseFormProps {
  schema: RJSFSchema;
  uiSchema: UiSchema;
  categories: ReleaseCategory[];
  value?: Record<string, unknown>;
  onChange?: (data: Record<string, unknown>) => void;
  onSubmit?: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
  isDirty?: boolean;
  submitLabel?: string;
  className?: string;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-') || 'category'
  );
}

function buildFieldId(path: string) {
  return `root_${path.replace(/[.\[\]]+/g, '_')}`.replace(/_+/g, '_');
}

function getValueAtPath(data: unknown, path: string) {
  if (!path) return undefined;
  const segments = path.split('.');
  let current: any = data;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (segment === 'items') {
      return Array.isArray(current) && current.length > 0
        ? current
        : undefined;
    }

    current = current[segment];
  }

  return current;
}

export function CategoryBasedReleaseForm({
  schema,
  uiSchema,
  categories,
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  isDirty = true,
  submitLabel = 'Save configuration',
  className,
}: CategoryBasedReleaseFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(value || {});
  const [activeNavId, setActiveNavId] = useState<string>('');

  useEffect(() => {
    setFormData(value || {});
  }, [value]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  const categoryStatuses = useMemo(() => {
    const statusMap = new Map<string, NavigationStatus>();

    sortedCategories.forEach((category) => {
      if (!category.fields || category.fields.length === 0) {
        statusMap.set(category.name, undefined);
        return;
      }

      const missingRequired = category.fields.some((field) => {
        if (!field.required) {
          return false;
        }
        const valueAtPath = getValueAtPath(formData, field.path);
        return valueAtPath === undefined || valueAtPath === '';
      });

      statusMap.set(category.name, missingRequired ? 'incomplete' : 'complete');
    });

    return statusMap;
  }, [sortedCategories, formData]);

  const navigationItems = useMemo(() => {
    return sortedCategories.map((category) => ({
      id: `category:${slugify(category.name)}`,
      label: category.name,
      status: categoryStatuses.get(category.name),
    }));
  }, [sortedCategories, categoryStatuses]);

  const navigationTargets = useMemo(() => {
    const targets = new Map<string, string>();

    sortedCategories.forEach((category) => {
      const firstField = [...(category.fields || [])].sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.title.localeCompare(b.title);
      })[0];

      if (firstField) {
        targets.set(`category:${slugify(category.name)}`, buildFieldId(firstField.path));
      }
    });

    return targets;
  }, [sortedCategories]);

  useEffect(() => {
    if (navigationItems.length > 0 && !activeNavId) {
      setActiveNavId(navigationItems[0].id);
    }
  }, [navigationItems, activeNavId]);

  useEffect(() => {
    if (navigationTargets.size === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const entry = visible[0];
          const categoryName = entry.target.getAttribute('data-category');
          if (categoryName) {
            const navId = `category:${slugify(categoryName)}`;
            setActiveNavId(navId);
          }
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0.1, 0.25, 0.5],
      }
    );

    navigationTargets.forEach((targetId) => {
      const element = document.querySelector<HTMLElement>(
        `[data-field-id="${targetId}"]`
      );
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [navigationTargets]);

  const handleNavigationClick = useCallback(
    (itemId: string) => {
      setActiveNavId(itemId);
      const targetId = navigationTargets.get(itemId);

      if (targetId) {
        const element = document.querySelector<HTMLElement>(
          `[data-field-id="${targetId}"]`
        );

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [navigationTargets]
  );

  const handleFormChange = useCallback(
    (data: any) => {
      setFormData(data);
      onChange?.(data);
    },
    [onChange]
  );

  const handleSubmit = useCallback(() => {
    onSubmit?.(formData);
  }, [formData, onSubmit]);

  if (!schema || !uiSchema) {
    return (
      <Alert className="bg-muted/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Loading release schema</AlertTitle>
        <AlertDescription>
          We could not load the generated release schema files. Ensure the schema
          generation pipeline has been executed.
        </AlertDescription>
      </Alert>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <Alert className="border-yellow-500/30 bg-yellow-50 dark:border-yellow-600/40 dark:bg-muted">
        <AlertTitle>No categories available</AlertTitle>
        <AlertDescription>
          The release schema does not include any <code>x-category</code> metadata.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]', className)}>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase">
          Configuration navigation
        </h2>
        <HierarchicalNavigation
          items={navigationItems}
          activeItemId={activeNavId || navigationItems[0]?.id || ''}
          onItemClick={handleNavigationClick}
        />
      </div>

      <div className="space-y-6">
        <ReleaseConfigForm
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={handleFormChange}
        />

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}


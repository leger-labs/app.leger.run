import { useCallback, useEffect, useMemo, useState } from 'react';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { ReleaseConfigForm } from '@/components/rjsf/ReleaseConfigForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReleaseCategory } from '@/types/release-schema';
import { CategoryTabs, CategoryTabPanel } from '@/components/ui/tabs/category-tabs';
import {
  filterFieldsByDependencies,
  getCategoryStatus,
  categoryHasVisibleFields,
} from '@/lib/progressive-disclosure';

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
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    setFormData(value || {});
  }, [value]);

  // Filter categories based on whether they have visible fields
  const visibleCategories = useMemo(() => {
    return categories.filter((category) =>
      categoryHasVisibleFields(category, formData, schema)
    );
  }, [categories, formData, schema]);

  // Set initial active tab
  useEffect(() => {
    if (visibleCategories.length > 0 && !activeTab) {
      setActiveTab(slugify(visibleCategories[0].name));
    }
  }, [visibleCategories, activeTab]);

  // Calculate category statuses with progressive disclosure
  const categoryStatuses = useMemo(() => {
    const statusMap = new Map<string, NavigationStatus>();

    visibleCategories.forEach((category) => {
      const status = getCategoryStatus(category, formData, schema);
      statusMap.set(category.name, status);
    });

    return statusMap;
  }, [visibleCategories, formData, schema]);

  // Create tabs with status indicators
  const tabs = useMemo(() => {
    return visibleCategories.map((category) => ({
      id: slugify(category.name),
      label: category.name,
      status: categoryStatuses.get(category.name),
    }));
  }, [visibleCategories, categoryStatuses]);

  // Get current tab index for navigation
  const currentTabIndex = useMemo(() => {
    return tabs.findIndex((tab) => tab.id === activeTab);
  }, [tabs, activeTab]);

  const canGoPrevious = currentTabIndex > 0;
  const canGoNext = currentTabIndex < tabs.length - 1;
  const isLastTab = currentTabIndex === tabs.length - 1;

  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  }, [canGoPrevious, tabs, currentTabIndex]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  }, [canGoNext, tabs, currentTabIndex]);

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

  // Get filtered fields for current category
  const getCurrentCategoryFields = useCallback(
    (categoryName: string) => {
      const category = visibleCategories.find((cat) => cat.name === categoryName);
      if (!category) return [];

      const filtered = filterFieldsByDependencies(category, formData, schema);
      return filtered.fields;
    },
    [visibleCategories, formData, schema]
  );

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

  if (visibleCategories.length === 0) {
    return (
      <Alert className="border-yellow-500/30 bg-yellow-50 dark:border-yellow-600/40 dark:bg-muted">
        <AlertTitle>No configuration needed</AlertTitle>
        <AlertDescription>
          All configuration categories are either managed elsewhere or have no available options.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <CategoryTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
        {visibleCategories.map((category) => {
          const fields = getCurrentCategoryFields(category.name);

          return (
            <CategoryTabPanel key={category.name} value={slugify(category.name)}>
              <div className="space-y-6">
                {/* Category description */}
                {category.name === 'Features' && (
                  <Alert>
                    <AlertTitle>Feature Toggles</AlertTitle>
                    <AlertDescription>
                      Enable the features you want to use. Only enabled features will show
                      configuration options in subsequent tabs.
                    </AlertDescription>
                  </Alert>
                )}

                {category.name === 'Providers' && (
                  <Alert>
                    <AlertTitle>Provider Selection</AlertTitle>
                    <AlertDescription>
                      Choose which provider to use for each enabled feature. Configuration
                      options will appear based on your selections.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Form for current category */}
                <ReleaseConfigForm
                  schema={schema}
                  uiSchema={uiSchema}
                  formData={formData}
                  onChange={handleFormChange}
                  visibleFields={fields.map((f) => f.path)}
                />

                {/* Navigation buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {!isLastTab ? (
                      <Button onClick={handleNext} disabled={!canGoNext}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={isSubmitting || !isDirty}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CategoryTabPanel>
          );
        })}
      </CategoryTabs>
    </div>
  );
}

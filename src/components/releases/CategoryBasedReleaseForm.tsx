import { useCallback, useEffect, useMemo, useState } from 'react';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { ReleaseConfigForm } from '@/components/rjsf/ReleaseConfigForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ChevronLeft, ChevronRight, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReleaseCategory } from '@/types/release-schema';
import { CategoryTabs, CategoryTabPanel } from '@/components/ui/tabs/category-tabs';
import {
  filterFieldsByDependencies,
  getCategoryStatus,
  categoryHasVisibleFields,
} from '@/lib/progressive-disclosure';
import { getFieldGroups } from '@/lib/field-grouping';
import { FieldGroupList } from '@/components/releases/FieldGroup';
import { ConfigurationSummary } from '@/components/releases/ConfigurationSummary';

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

/**
 * Get enhanced guidance for each category
 */
function getCategoryGuidance(categoryName: string, formData: Record<string, unknown>) {
  const guidance: Record<string, { title: string; description: string; icon?: React.ReactNode }> = {
    Features: {
      title: 'Feature Toggles',
      description:
        'Enable the capabilities you want to use. Only enabled features will show configuration options in subsequent steps. Start by selecting the features your deployment needs.',
      icon: <Sparkles className="h-4 w-4" />,
    },
    Providers: {
      title: 'Provider Selection',
      description:
        'Choose which provider to use for each enabled feature. Your selections here determine which configuration options appear in the next steps. Sensible defaults are pre-selected.',
      icon: <Info className="h-4 w-4" />,
    },
    Core: {
      title: 'Core Configuration',
      description:
        'Configure the essential settings for your selected providers. These settings control how your services communicate and behave.',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    'AI Assistance': {
      title: 'AI Task Models',
      description:
        'Configure which models to use for automated tasks like title generation, tagging, and autocomplete. These are small, fast models that enhance the user experience.',
      icon: <Sparkles className="h-4 w-4" />,
    },
    Advanced: {
      title: 'Advanced Settings',
      description:
        'Fine-tune advanced parameters for your enabled features. These settings are optional and have sensible defaults.',
      icon: <Info className="h-4 w-4" />,
    },
    Security: {
      title: 'Security Configuration',
      description:
        'Configure authentication and authorization settings for your deployment.',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    Infrastructure: {
      title: 'Infrastructure Settings',
      description:
        'Configure network and service infrastructure. These are typically set once during initial setup.',
      icon: <Info className="h-4 w-4" />,
    },
  };

  return guidance[categoryName] || {
    title: categoryName,
    description: `Configure ${categoryName} settings`,
  };
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

  // Create tabs with status indicators (including review step)
  const tabs = useMemo(() => {
    const categoryTabs = visibleCategories.map((category) => ({
      id: slugify(category.name),
      label: category.name,
      status: categoryStatuses.get(category.name),
    }));

    // Add review step at the end
    categoryTabs.push({
      id: 'review',
      label: 'Review',
      status: undefined, // No status for review step
    });

    return categoryTabs;
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
        {/* Regular category tabs */}
        {visibleCategories.map((category) => {
          const fields = getCurrentCategoryFields(category.name);
          const guidance = getCategoryGuidance(category.name, formData);
          const fieldGroups = getFieldGroups(category, fields, formData, schema);

          return (
            <CategoryTabPanel key={category.name} value={slugify(category.name)}>
              <div className="space-y-6">
                {/* Enhanced category guidance */}
                <Alert className="border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-3">
                    {guidance.icon && (
                      <div className="mt-0.5 text-primary">{guidance.icon}</div>
                    )}
                    <div className="flex-1">
                      <AlertTitle className="text-base font-semibold">
                        {guidance.title}
                      </AlertTitle>
                      <AlertDescription className="mt-2 text-sm leading-relaxed">
                        {guidance.description}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>

                {/* Grouped fields with collapsible sections */}
                {fieldGroups.length > 0 ? (
                  <FieldGroupList
                    groups={fieldGroups}
                    renderFields={(groupFields) => (
                      <ReleaseConfigForm
                        schema={schema}
                        uiSchema={uiSchema}
                        formData={formData}
                        onChange={handleFormChange}
                        visibleFields={groupFields.map((f) => f.path)}
                      />
                    )}
                  />
                ) : (
                  <Alert className="border-muted bg-muted/20">
                    <Info className="h-4 w-4" />
                    <AlertTitle>No configuration needed</AlertTitle>
                    <AlertDescription>
                      This category has no visible fields based on your current selections. This
                      may change if you enable additional features or select different providers.
                    </AlertDescription>
                  </Alert>
                )}

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
                    <Button onClick={handleNext} disabled={!canGoNext}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </CategoryTabPanel>
          );
        })}

        {/* Review step */}
        <CategoryTabPanel key="review" value="review">
          <div className="space-y-6">
            <ConfigurationSummary formData={formData} schema={schema} uiSchema={uiSchema} />

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

              <Button onClick={handleSubmit} disabled={isSubmitting || !isDirty}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitLabel}
              </Button>
            </div>
          </div>
        </CategoryTabPanel>
      </CategoryTabs>
    </div>
  );
}

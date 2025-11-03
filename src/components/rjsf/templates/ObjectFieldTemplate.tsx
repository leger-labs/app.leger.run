/**
 * RJSF Object Field Template
 * Controls the layout of object fields (nested sections)
 */

import { ObjectFieldTemplateProps } from '@rjsf/utils';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    idSchema,
    schema,
    formData,
    onAddClick,
  } = props;

  const isRoot = idSchema.$id === 'root';
  const category = schema['x-category'];

  // Group properties by x-category if available
  const categorizedProperties: Record<string, typeof properties> = {};
  const uncategorizedProperties: typeof properties = [];

  properties.forEach((prop) => {
    const propCategory = prop.content.props.schema['x-category'];
    if (propCategory) {
      if (!categorizedProperties[propCategory]) {
        categorizedProperties[propCategory] = [];
      }
      categorizedProperties[propCategory].push(prop);
    } else {
      uncategorizedProperties.push(prop);
    }
  });

  // Sort properties by x-display-order
  const sortProperties = (props: typeof properties) => {
    return [...props].sort((a, b) => {
      const orderA = a.content.props.schema['x-display-order'] ?? 999;
      const orderB = b.content.props.schema['x-display-order'] ?? 999;
      return orderA - orderB;
    });
  };

  const renderProperties = (props: typeof properties) => {
    const sorted = sortProperties(props);
    return sorted.map((element) => (
      <div key={element.name} className="property-wrapper">
        {element.content}
      </div>
    ));
  };

  // Root level - render as sections
  if (isRoot) {
    return (
      <div className="space-y-8">
        {Object.entries(categorizedProperties).map(([cat, props]) => (
          <div key={cat} className="category-section">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{cat}</h2>
              <Separator className="mt-2" />
            </div>
            <div className="space-y-4">{renderProperties(props)}</div>
          </div>
        ))}
        {uncategorizedProperties.length > 0 && (
          <div className="space-y-4">{renderProperties(uncategorizedProperties)}</div>
        )}
      </div>
    );
  }

  // Nested object - render as a group
  return (
    <div
      className={cn(
        'object-field',
        'border rounded-lg p-4 space-y-4',
        disabled && 'opacity-50'
      )}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{renderProperties(properties)}</div>
    </div>
  );
}

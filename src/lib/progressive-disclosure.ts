/**
 * Progressive Disclosure Utility
 *
 * Evaluates x-depends-on conditions to determine if a field should be visible
 */

import type { ReleaseCategory } from '@/types/release-schema';

export interface DependencyCondition {
  path: string;
  value: any;
}

/**
 * Get value at a path in an object
 */
export function getValueAtPath(data: any, path: string): any {
  if (!path) return undefined;

  const segments = path.split('.');
  let current = data;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

/**
 * Check if a field's dependencies are satisfied
 */
export function checkDependencies(
  dependencies: Record<string, any> | undefined,
  formData: Record<string, any>
): boolean {
  if (!dependencies || Object.keys(dependencies).length === 0) {
    return true; // No dependencies = always visible
  }

  // All conditions must be satisfied (AND logic)
  for (const [path, expectedValue] of Object.entries(dependencies)) {
    const actualValue = getValueAtPath(formData, path);

    // Handle different comparison types
    if (typeof expectedValue === 'boolean') {
      if (actualValue !== expectedValue) {
        return false;
      }
    } else if (Array.isArray(expectedValue)) {
      // Value must be in array
      if (!expectedValue.includes(actualValue)) {
        return false;
      }
    } else {
      // Exact match
      if (actualValue !== expectedValue) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Filter fields in a category based on their dependencies
 */
export function filterFieldsByDependencies(
  category: ReleaseCategory,
  formData: Record<string, any>,
  schema: any
): ReleaseCategory {
  const filteredFields = category.fields.filter((field) => {
    // Get the schema definition for this field
    const schemaDef = getSchemaForField(schema, field.path);

    if (!schemaDef) {
      return true; // If we can't find schema, show the field
    }

    // Check x-depends-on
    const dependencies = schemaDef['x-depends-on'];
    return checkDependencies(dependencies, formData);
  });

  return {
    ...category,
    fields: filteredFields,
  };
}

/**
 * Get schema definition for a field path
 */
export function getSchemaForField(schema: any, fieldPath: string): any {
  if (!schema || !fieldPath) return null;

  const segments = fieldPath.split('.');
  let current = schema;

  for (const segment of segments) {
    if (!current) return null;

    // Handle array items
    if (segment === 'items') {
      if (current.items) {
        current = Array.isArray(current.items) ? current.items[0] : current.items;
      } else {
        return null;
      }
      continue;
    }

    // Navigate through properties
    if (current.properties && current.properties[segment]) {
      current = current.properties[segment];
    } else if (current.type === 'object' && current.properties) {
      // Try to find in properties
      current = current.properties[segment];
    } else {
      return null;
    }
  }

  return current;
}

/**
 * Check if a category has any visible fields
 */
export function categoryHasVisibleFields(
  category: ReleaseCategory,
  formData: Record<string, any>,
  schema: any
): boolean {
  const filtered = filterFieldsByDependencies(category, formData, schema);
  return filtered.fields.length > 0;
}

/**
 * Get category completion status
 */
export function getCategoryStatus(
  category: ReleaseCategory,
  formData: Record<string, any>,
  schema: any
): 'complete' | 'incomplete' | undefined {
  const filtered = filterFieldsByDependencies(category, formData, schema);

  if (filtered.fields.length === 0) {
    return undefined; // No fields to complete
  }

  // Check if all required fields have values
  const missingRequired = filtered.fields.some((field) => {
    if (!field.required) {
      return false;
    }
    const value = getValueAtPath(formData, field.path);
    return value === undefined || value === '' || value === null;
  });

  return missingRequired ? 'incomplete' : 'complete';
}

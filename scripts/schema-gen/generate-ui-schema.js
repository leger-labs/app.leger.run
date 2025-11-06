#!/usr/bin/env node
/**
 * Generate RJSF uiSchema from JSON Schema with x-extensions
 *
 * This script processes the schema.json and generates:
 * - uiSchema.json: RJSF UI schema with progressive disclosure, ordering, help text, and widget hints
 * - categories.json: Category metadata derived from x-category/x-category-order for navigation
 * - schema.json: Copy of the latest release schema for runtime consumption
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_PATH = join(__dirname, '../../src/data/core/schema.json');
const UI_SCHEMA_OUTPUT_PATH = join(
  __dirname,
  '../../src/generated/uiSchema.json'
);
const CATEGORIES_OUTPUT_PATH = join(
  __dirname,
  '../../src/generated/categories.json'
);
const SCHEMA_OUTPUT_PATH = join(
  __dirname,
  '../../src/generated/schema.json'
);

const SECRET_REFERENCE_HELP =
  'Select or enter a secret reference. Manage actual secret values in the API Keys tab.';

/**
 * Generate widget type based on JSON Schema type and format
 */
function getWidget(schema) {
  if (schema.type === 'boolean') {
    return 'checkbox';
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    return 'updown';
  }

  if (schema.type === 'string') {
    if (schema.enum) {
      return 'select';
    }
    if (schema.format === 'uri' || schema.format === 'url') {
      return 'uri';
    }
    if (schema['x-sensitive']) {
      return 'secret-reference';
    }
    if (schema.maxLength && schema.maxLength > 200) {
      return 'textarea';
    }
    return 'text';
  }

  return undefined;
}

/**
 * Convert x-depends-on to RJSF dependency format
 */
function processDependencies(schema) {
  if (!schema['x-depends-on']) {
    return undefined;
  }

  const deps = schema['x-depends-on'];
  const conditions = [];

  for (const [path, value] of Object.entries(deps)) {
    const parts = path.split('.');
    conditions.push({
      path: parts,
      value: value
    });
  }

  return conditions;
}

const DEFAULT_CATEGORY_ORDER = 999;

// Categories to exclude from release configurator (managed elsewhere)
const EXCLUDED_CATEGORIES = ['Infrastructure', 'Security'];

// Root properties to exclude (managed in Settings, not per-release)
const EXCLUDED_ROOT_PROPERTIES = ['tailscale', 'secrets', 'infrastructure'];

// Category ordering for release configurator
const CATEGORY_ORDER = {
  'Features': 10,
  'Providers': 20,
  'Core': 30,
  'AI Assistance': 40,
  'Advanced': 50
};

/**
 * Walk schema tree and collect category metadata
 */
function extractCategories(schema) {
  const categories = new Map();

  function registerCategory(categoryName, fieldMeta, schemaMeta) {
    // Skip excluded categories
    if (EXCLUDED_CATEGORIES.includes(categoryName)) {
      return;
    }

    if (!categories.has(categoryName)) {
      // Use explicit category order or default
      const explicitOrder = CATEGORY_ORDER[categoryName] !== undefined
        ? CATEGORY_ORDER[categoryName]
        : (schemaMeta['x-category-order'] !== undefined
            ? schemaMeta['x-category-order']
            : DEFAULT_CATEGORY_ORDER);

      categories.set(categoryName, {
        name: categoryName,
        order: explicitOrder,
        fields: []
      });
    }

    const category = categories.get(categoryName);
    category.fields.push(fieldMeta);
  }

  function walk(node, path = [], inheritedCategory, requiredSet = new Set()) {
    if (!node || typeof node !== 'object') {
      return;
    }

    const properties = node.properties || {};
    const currentRequired = new Set(node.required || []);

    Object.entries(properties).forEach(([propName, propSchema]) => {
      // Skip excluded root properties
      if (path.length === 0 && EXCLUDED_ROOT_PROPERTIES.includes(propName)) {
        return;
      }

      const fieldPath = [...path, propName];
      const explicitCategory = propSchema['x-category'];
      const categoryName = explicitCategory || inheritedCategory;

      if (categoryName) {
        registerCategory(
          categoryName,
          {
            path: fieldPath.join('.'),
            name: propName,
            title: propSchema.title || propName,
            type: propSchema.type || (propSchema.enum ? 'string' : 'object'),
            required: currentRequired.has(propName) || requiredSet.has(propName),
            order:
              propSchema['x-display-order'] !== undefined
                ? propSchema['x-display-order']
                : DEFAULT_CATEGORY_ORDER
          },
          propSchema
        );
      }

      if (propSchema.type === 'object' && propSchema.properties) {
        walk(propSchema, fieldPath, categoryName, currentRequired);
      } else if (propSchema.type === 'array' && propSchema.items) {
        const itemsSchema = Array.isArray(propSchema.items)
          ? propSchema.items[0]
          : propSchema.items;

        if (itemsSchema && typeof itemsSchema === 'object') {
          walk(itemsSchema, [...fieldPath, 'items'], categoryName, new Set());
        }
      }
    });
  }

  walk(schema, [], undefined, new Set(schema.required || []));

  return Array.from(categories.values())
    .map(category => ({
      ...category,
      order:
        category.order === undefined ? DEFAULT_CATEGORY_ORDER : category.order,
      fields: category.fields.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.title.localeCompare(b.title);
      })
    }))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    });
}

function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generate uiSchema for a property
 */
function generatePropertyUiSchema(propName, propSchema, context = {}) {
  const uiSchema = {};
  const { category } = context;

  // Widget
  const widget = getWidget(propSchema);
  if (widget) {
    uiSchema['ui:widget'] = widget;
  }

  if (propSchema['x-sensitive']) {
    if (!uiSchema['ui:placeholder']) {
      uiSchema['ui:placeholder'] = '{SECRET_NAME}';
    }

    if (propSchema['x-help'] || propSchema.description) {
      const existingHelp = propSchema['x-help'] || propSchema.description;
      uiSchema['ui:help'] = `${existingHelp}\n\n${SECRET_REFERENCE_HELP}`;
    } else {
      uiSchema['ui:help'] = SECRET_REFERENCE_HELP;
    }
  }

  // Help text
  if (propSchema['x-help'] || propSchema.description) {
    // Preserve help text set above for sensitive fields
    if (!uiSchema['ui:help']) {
      uiSchema['ui:help'] = propSchema['x-help'] || propSchema.description;
    }
  }

  // Display order
  if (propSchema['x-display-order'] !== undefined) {
    uiSchema['ui:order'] = propSchema['x-display-order'];
  }

  // Readonly
  if (propSchema['x-readonly']) {
    uiSchema['ui:readonly'] = true;
  }

  // Dependencies for conditional rendering
  const deps = processDependencies(propSchema);
  if (deps) {
    uiSchema['ui:dependencies'] = deps;
  }

  // Placeholder from examples
  if (propSchema.examples && propSchema.examples.length > 0) {
    uiSchema['ui:placeholder'] = propSchema.examples[0];
  }

  // Title
  if (propSchema.title) {
    uiSchema['ui:title'] = propSchema.title;
  }

  // Options for select widgets
  if (propSchema.enum) {
    uiSchema['ui:options'] = {
      enumOptions: propSchema.enum.map(val => ({
        value: val,
        label: val
      }))
    };
  }

  if (category) {
    uiSchema['ui:options'] = {
      ...(uiSchema['ui:options'] || {}),
      category
    };
  }

  return Object.keys(uiSchema).length > 0 ? uiSchema : undefined;
}

/**
 * Recursively process schema to generate uiSchema
 */
function processSchema(schema, path = [], parentCategory) {
  if (path.includes('secrets') || path.includes('tailscale') || path.includes('infrastructure')) {
    return {};
  }

  const uiSchema = {};

  if (schema.type === 'object' && schema.properties) {
    // Process each property
    const propUiSchemas = {};

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      // Skip excluded root properties
      if (path.length === 0 && EXCLUDED_ROOT_PROPERTIES.includes(propName)) {
        continue;
      }

      const category = propSchema['x-category'] || parentCategory;
      const propUiSchema = generatePropertyUiSchema(propName, propSchema, {
        category
      });

      if (propSchema.type === 'object' && propSchema.properties) {
        // Recursively process nested objects
        const nestedUiSchema = processSchema(
          propSchema,
          [...path, propName],
          category
        );
        const combinedUiSchema = { ...propUiSchema };
        if (Object.keys(nestedUiSchema).length > 0) {
          Object.assign(combinedUiSchema, nestedUiSchema);
        }
        if (Object.keys(combinedUiSchema).length > 0) {
          propUiSchemas[propName] = combinedUiSchema;
        }
      } else if (propUiSchema) {
        propUiSchemas[propName] = propUiSchema;
      }
    }

    Object.assign(uiSchema, propUiSchemas);

    // Add ui:order based on x-display-order
    const orderedProps = Object.entries(schema.properties)
      .filter(([, propSchema]) => propSchema['x-display-order'] !== undefined)
      .sort((a, b) => a[1]['x-display-order'] - b[1]['x-display-order'])
      .map(([propName]) => propName);

    if (orderedProps.length > 0) {
      uiSchema['ui:order'] = [...orderedProps, '*'];
    }
  }

  return uiSchema;
}

/**
 * Main generation function
 */
function generateUiSchema() {
  console.log('Loading schema from:', SCHEMA_PATH);

  try {
    const schemaContent = readFileSync(SCHEMA_PATH, 'utf-8');
    const schema = JSON.parse(schemaContent);

    console.log('Generating uiSchema...');
    const uiSchema = processSchema(schema);
    const categories = extractCategories(schema);

    ensureDirectoryExists(UI_SCHEMA_OUTPUT_PATH);
    ensureDirectoryExists(CATEGORIES_OUTPUT_PATH);
    ensureDirectoryExists(SCHEMA_OUTPUT_PATH);

    writeFileSync(
      UI_SCHEMA_OUTPUT_PATH,
      JSON.stringify(uiSchema, null, 2),
      'utf-8'
    );

    writeFileSync(
      CATEGORIES_OUTPUT_PATH,
      JSON.stringify(categories, null, 2),
      'utf-8'
    );

    writeFileSync(
      SCHEMA_OUTPUT_PATH,
      JSON.stringify(schema, null, 2),
      'utf-8'
    );

    console.log('✓ uiSchema generated successfully at:', UI_SCHEMA_OUTPUT_PATH);
    console.log('  Fields processed:', Object.keys(uiSchema).length);
    console.log('✓ categories generated at:', CATEGORIES_OUTPUT_PATH);
    console.log('  Total categories:', categories.length);

  } catch (error) {
    console.error('✗ Error generating uiSchema:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateUiSchema();
}

export { generateUiSchema };

#!/usr/bin/env node
/**
 * Generate RJSF uiSchema from JSON Schema with x-extensions
 *
 * This script processes the schema.json and generates a uiSchema.json that includes:
 * - Progressive disclosure rules based on x-depends-on
 * - Field ordering based on x-display-order
 * - Widget selection based on field types
 * - Help text and descriptions
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_PATH = join(__dirname, '../../schemas/releases/latest/schema.json');
const OUTPUT_PATH = join(__dirname, '../../src/generated/uiSchema.json');

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

/**
 * Generate uiSchema for a property
 */
function generatePropertyUiSchema(propName, propSchema) {
  const uiSchema = {};

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

  return Object.keys(uiSchema).length > 0 ? uiSchema : undefined;
}

/**
 * Recursively process schema to generate uiSchema
 */
function processSchema(schema, path = []) {
  if (path.includes('secrets')) {
    return {};
  }

  const uiSchema = {};

  if (schema.type === 'object' && schema.properties) {
    // Process each property
    const propUiSchemas = {};

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propName === 'secrets') {
        continue;
      }

      const propUiSchema = generatePropertyUiSchema(propName, propSchema);

      if (propSchema.type === 'object' && propSchema.properties) {
        // Recursively process nested objects
        const nestedUiSchema = processSchema(propSchema, [...path, propName]);
        if (Object.keys(nestedUiSchema).length > 0) {
          propUiSchemas[propName] = nestedUiSchema;
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

    // Ensure output directory exists
    const outputDir = dirname(OUTPUT_PATH);
    import('fs').then(fs => {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    });

    // Write output
    writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(uiSchema, null, 2),
      'utf-8'
    );

    console.log('✓ uiSchema generated successfully at:', OUTPUT_PATH);
    console.log('  Fields processed:', Object.keys(uiSchema).length);

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

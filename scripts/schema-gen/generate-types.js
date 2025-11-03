#!/usr/bin/env node
/**
 * Generate TypeScript types from JSON Schema
 *
 * This provides type safety for the release configuration form data
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_PATH = join(__dirname, '../../schemas/releases/latest/schema.json');
const OUTPUT_PATH = join(__dirname, '../../src/generated/release-config.types.ts');

/**
 * Convert JSON Schema type to TypeScript type
 */
function jsonTypeToTsType(schema) {
  if (schema.enum) {
    return schema.enum.map(v => JSON.stringify(v)).join(' | ');
  }

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      if (schema.items) {
        return `Array<${jsonTypeToTsType(schema.items)}>`;
      }
      return 'Array<any>';
    case 'object':
      return 'object';
    case 'null':
      return 'null';
    default:
      if (Array.isArray(schema.type)) {
        return schema.type.map(t => jsonTypeToTsType({ type: t })).join(' | ');
      }
      return 'any';
  }
}

/**
 * Generate TypeScript interface from JSON Schema object
 */
function generateInterface(name, schema, indent = 0) {
  const indentStr = '  '.repeat(indent);
  const lines = [`${indentStr}export interface ${name} {`];

  if (schema.type === 'object' && schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const required = schema.required?.includes(propName);
      const optional = required ? '' : '?';

      // Add JSDoc comment if description exists
      if (propSchema.title || propSchema.description) {
        lines.push(`${indentStr}  /**`);
        if (propSchema.title) {
          lines.push(`${indentStr}   * ${propSchema.title}`);
        }
        if (propSchema.description) {
          lines.push(`${indentStr}   * ${propSchema.description}`);
        }
        lines.push(`${indentStr}   */`);
      }

      // Generate type
      let tsType;
      if (propSchema.type === 'object' && propSchema.properties) {
        // Nested object - generate inline interface
        const nestedLines = generateInterface(
          `${name}_${propName.charAt(0).toUpperCase() + propName.slice(1)}`,
          propSchema,
          indent + 1
        );
        // Use the type name instead of inline
        tsType = `${name}_${propName.charAt(0).toUpperCase() + propName.slice(1)}`;
      } else {
        tsType = jsonTypeToTsType(propSchema);
      }

      lines.push(`${indentStr}  ${propName}${optional}: ${tsType};`);
    }
  }

  lines.push(`${indentStr}}`);
  return lines.join('\n');
}

/**
 * Generate all nested interfaces first, then main interface
 */
function generateAllInterfaces(schema, baseName = 'ReleaseConfig') {
  const interfaces = [];

  function processSchema(schema, name) {
    if (schema.type === 'object' && schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propSchema.type === 'object' && propSchema.properties) {
          const nestedName = `${name}_${propName.charAt(0).toUpperCase() + propName.slice(1)}`;
          processSchema(propSchema, nestedName);
          interfaces.push(generateInterface(nestedName, propSchema));
        }
      }
    }
  }

  // Process all nested interfaces first
  processSchema(schema, baseName);

  // Add main interface last
  interfaces.push(generateInterface(baseName, schema));

  return interfaces;
}

/**
 * Main generation function
 */
function generateTypes() {
  console.log('Loading schema from:', SCHEMA_PATH);

  try {
    const schemaContent = readFileSync(SCHEMA_PATH, 'utf-8');
    const schema = JSON.parse(schemaContent);

    console.log('Generating TypeScript types...');

    // Generate interfaces
    const interfaces = generateAllInterfaces(schema);

    // Create output with header
    const output = [
      '/**',
      ' * AUTO-GENERATED FILE - DO NOT EDIT',
      ' *',
      ' * TypeScript types for Leger Release Configuration',
      ' * Generated from: schemas/releases/latest/schema.json',
      ` * Generated at: ${new Date().toISOString()}`,
      ' */',
      '',
      interfaces.join('\n\n'),
      ''
    ].join('\n');

    // Ensure output directory exists
    const outputDir = dirname(OUTPUT_PATH);
    import('fs').then(fs => {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    });

    // Write output
    writeFileSync(OUTPUT_PATH, output, 'utf-8');

    console.log('✓ TypeScript types generated successfully at:', OUTPUT_PATH);
    console.log('  Interfaces generated:', interfaces.length);

  } catch (error) {
    console.error('✗ Error generating types:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTypes();
}

export { generateTypes };

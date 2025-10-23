#!/usr/bin/env node
/**
 * Phase 1.3: RJSF Integration Analysis
 *
 * Identifies and analyzes all RJSF (React JSON Schema Form) integration points:
 * 1. Custom widgets
 * 2. Custom fields
 * 3. Field templates
 * 4. UI Schema usage
 * 5. Which UI components are used in RJSF contexts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Find all files that might contain RJSF integration
function findRJSFFiles(dir) {
  const results = [];

  function scan(directory) {
    try {
      const entries = fs.readdirSync(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            scan(fullPath);
          }
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Check if file contains RJSF-related code
          const rjsfIndicators = [
            '@rjsf',
            'react-jsonschema-form',
            'customWidgets',
            'customFields',
            'FieldTemplate',
            'ObjectFieldTemplate',
            'ArrayFieldTemplate',
            'uiSchema',
            'UISchemaElement',
            'WidgetProps',
            'FieldProps'
          ];

          if (rjsfIndicators.some(indicator => content.includes(indicator))) {
            results.push({
              path: fullPath,
              relativePath: path.relative(ROOT_DIR, fullPath),
              content
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning ${directory}:`, err.message);
    }
  }

  scan(dir);
  return results;
}

// Analyze custom widgets
function analyzeCustomWidgets(file) {
  const widgets = [];

  // Pattern 1: const customWidgets = { ... }
  const widgetsObjectRegex = /const\s+(\w*[Ww]idgets\w*)\s*=\s*{([^}]+)}/gs;
  let match;

  while ((match = widgetsObjectRegex.exec(file.content)) !== null) {
    const widgetName = match[1];
    const widgetContent = match[2];

    // Extract individual widget definitions
    const widgetEntries = widgetContent.split(',').map(entry => entry.trim()).filter(Boolean);

    widgetEntries.forEach(entry => {
      const entryMatch = entry.match(/(\w+):\s*(.+)/);
      if (entryMatch) {
        widgets.push({
          file: file.relativePath,
          objectName: widgetName,
          widgetKey: entryMatch[1],
          widgetValue: entryMatch[2].trim(),
          context: match[0]
        });
      }
    });
  }

  // Pattern 2: Direct widget component definitions
  const widgetComponentRegex = /(?:export\s+)?(?:const|function)\s+(\w+Widget)\s*[=(:]/g;

  while ((match = widgetComponentRegex.exec(file.content)) !== null) {
    widgets.push({
      file: file.relativePath,
      componentName: match[1],
      type: 'component',
      context: match[0]
    });
  }

  return widgets;
}

// Analyze custom fields
function analyzeCustomFields(file) {
  const fields = [];

  // Pattern 1: const customFields = { ... }
  const fieldsObjectRegex = /const\s+(\w*[Ff]ields\w*)\s*=\s*{([^}]+)}/gs;
  let match;

  while ((match = fieldsObjectRegex.exec(file.content)) !== null) {
    const fieldName = match[1];
    const fieldContent = match[2];

    const fieldEntries = fieldContent.split(',').map(entry => entry.trim()).filter(Boolean);

    fieldEntries.forEach(entry => {
      const entryMatch = entry.match(/(\w+):\s*(.+)/);
      if (entryMatch) {
        fields.push({
          file: file.relativePath,
          objectName: fieldName,
          fieldKey: entryMatch[1],
          fieldValue: entryMatch[2].trim(),
          context: match[0]
        });
      }
    });
  }

  // Pattern 2: Direct field component definitions
  const fieldComponentRegex = /(?:export\s+)?(?:const|function)\s+(\w+Field)\s*[=(:]/g;

  while ((match = fieldComponentRegex.exec(file.content)) !== null) {
    fields.push({
      file: file.relativePath,
      componentName: match[1],
      type: 'component',
      context: match[0]
    });
  }

  return fields;
}

// Analyze templates
function analyzeTemplates(file) {
  const templates = [];

  // Common RJSF template patterns
  const templatePatterns = [
    /(?:export\s+)?(?:const|function)\s+(FieldTemplate|ObjectFieldTemplate|ArrayFieldTemplate)\s*[=(:]/g,
    /templates\s*=\s*{([^}]+)}/gs
  ];

  templatePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(file.content)) !== null) {
      templates.push({
        file: file.relativePath,
        name: match[1] || 'templates',
        context: match[0]
      });
    }
  });

  return templates;
}

// Analyze UI components used in RJSF contexts
function analyzeUIComponentsInRJSF(file) {
  const uiComponents = new Set();

  // Extract all UI component imports
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/components\/ui\/([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(file.content)) !== null) {
    const imports = match[1].split(',').map(s => s.trim());
    const source = match[2];

    imports.forEach(imp => {
      uiComponents.add({
        component: imp,
        source: `@/components/ui/${source}`,
        file: file.relativePath
      });
    });
  }

  return Array.from(uiComponents);
}

// Analyze UI Schema patterns
function analyzeUISchema(file) {
  const uiSchemas = [];

  // Pattern: uiSchema = { ... } or const uiSchema = { ... }
  const uiSchemaRegex = /(?:const|let|var)?\s*uiSchema\s*[:=]\s*{/g;
  let match;

  while ((match = uiSchemaRegex.exec(file.content)) !== null) {
    const startIndex = match.index;
    const context = file.content.substring(startIndex, Math.min(startIndex + 200, file.content.length));

    uiSchemas.push({
      file: file.relativePath,
      context: context.substring(0, 200) + (context.length > 200 ? '...' : '')
    });
  }

  return uiSchemas;
}

// Detect form validation patterns
function analyzeValidation(file) {
  const validationPatterns = [];

  const patterns = [
    { name: 'customValidate', regex: /customValidate\s*[:=]/g },
    { name: 'transformErrors', regex: /transformErrors\s*[:=]/g },
    { name: 'extraErrors', regex: /extraErrors\s*[:=]/g },
    { name: 'liveValidate', regex: /liveValidate\s*[:=]/g }
  ];

  patterns.forEach(({ name, regex }) => {
    if (regex.test(file.content)) {
      validationPatterns.push({
        file: file.relativePath,
        pattern: name
      });
    }
  });

  return validationPatterns;
}

// Main execution
async function main() {
  console.log('Phase 1.3: Analyzing RJSF integration...\n');

  const srcDir = path.join(ROOT_DIR, 'src');
  const rjsfFiles = findRJSFFiles(srcDir);

  console.log(`Found ${rjsfFiles.length} files with RJSF integration\n`);

  const analysis = {
    metadata: {
      timestamp: new Date().toISOString(),
      files_analyzed: rjsfFiles.length
    },
    files: rjsfFiles.map(f => f.relativePath),
    widgets: [],
    fields: [],
    templates: [],
    ui_components_in_rjsf: [],
    ui_schemas: [],
    validation_patterns: [],
    summary: {}
  };

  // Analyze each file
  rjsfFiles.forEach(file => {
    console.log(`Analyzing: ${file.relativePath}`);

    analysis.widgets.push(...analyzeCustomWidgets(file));
    analysis.fields.push(...analyzeCustomFields(file));
    analysis.templates.push(...analyzeTemplates(file));
    analysis.ui_components_in_rjsf.push(...analyzeUIComponentsInRJSF(file));
    analysis.ui_schemas.push(...analyzeUISchema(file));
    analysis.validation_patterns.push(...analyzeValidation(file));
  });

  // Deduplicate UI components
  const uniqueUIComponents = new Map();
  analysis.ui_components_in_rjsf.forEach(comp => {
    const key = `${comp.component}-${comp.source}`;
    if (!uniqueUIComponents.has(key)) {
      uniqueUIComponents.set(key, {
        component: comp.component,
        source: comp.source,
        usedInFiles: []
      });
    }
    uniqueUIComponents.get(key).usedInFiles.push(comp.file);
  });

  analysis.ui_components_in_rjsf = Array.from(uniqueUIComponents.values());

  // Generate summary
  analysis.summary = {
    total_rjsf_files: rjsfFiles.length,
    total_widgets: analysis.widgets.length,
    total_fields: analysis.fields.length,
    total_templates: analysis.templates.length,
    unique_ui_components: analysis.ui_components_in_rjsf.length,
    ui_schemas_count: analysis.ui_schemas.length,
    validation_patterns_count: analysis.validation_patterns.length
  };

  // Generate recommendations
  analysis.recommendations = {
    critical_components: analysis.ui_components_in_rjsf
      .filter(comp => comp.usedInFiles.length > 3)
      .map(comp => ({
        component: comp.component,
        source: comp.source,
        files: comp.usedInFiles,
        recommendation: 'This component is heavily used in RJSF contexts. Migration requires careful testing of all forms.'
      })),
    widget_migration_checklist: [
      {
        task: 'Review all custom widgets',
        count: analysis.widgets.length,
        files: [...new Set(analysis.widgets.map(w => w.file))]
      },
      {
        task: 'Review all custom fields',
        count: analysis.fields.length,
        files: [...new Set(analysis.fields.map(f => f.file))]
      },
      {
        task: 'Review all templates',
        count: analysis.templates.length,
        files: [...new Set(analysis.templates.map(t => t.file))]
      }
    ],
    migration_priority: [
      'Test all RJSF forms in isolated environment',
      'Update custom widgets to use direct Radix components',
      'Update custom fields to use direct Radix components',
      'Update templates to use direct Radix components',
      'Re-test all forms after each component migration',
      'Validate form submission and validation still work'
    ]
  };

  // Write report
  const outputPath = path.join(__dirname, 'phase1-3-rjsf-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log('RJSF INTEGRATION ANALYSIS COMPLETE');
  console.log('='.repeat(60));
  console.log(`RJSF-related files: ${rjsfFiles.length}`);
  console.log(`Custom widgets: ${analysis.widgets.length}`);
  console.log(`Custom fields: ${analysis.fields.length}`);
  console.log(`Templates: ${analysis.templates.length}`);
  console.log(`UI components in RJSF: ${analysis.ui_components_in_rjsf.length}`);
  console.log(`\nReport written to: ${outputPath}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error during RJSF analysis:', err);
  process.exit(1);
});

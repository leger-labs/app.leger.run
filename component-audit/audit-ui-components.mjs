#!/usr/bin/env node
/**
 * Comprehensive UI Component Usage Audit
 *
 * This script scans the entire codebase to identify:
 * 1. All UI component usages
 * 2. Dependency chains
 * 3. RJSF integration points
 * 4. Props patterns
 * 5. Domain vs generic components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');

// Generic UI components to audit (from shadcn/ui + Radix)
const GENERIC_UI_COMPONENTS = [
  'Button', 'Input', 'Textarea', 'Select', 'Checkbox', 'RadioGroup',
  'Switch', 'Label', 'Form', 'Card', 'Accordion', 'Tabs', 'Dialog',
  'AlertDialog', 'Sheet', 'Popover', 'Tooltip', 'HoverCard', 'Drawer',
  'Table', 'Badge', 'Avatar', 'Calendar', 'Progress', 'Skeleton',
  'Separator', 'ScrollArea', 'DropdownMenu', 'ContextMenu',
  'NavigationMenu', 'Menubar', 'Breadcrumb', 'Pagination', 'Slider',
  'Toggle', 'ToggleGroup', 'Command', 'InputOTP', 'Carousel', 'Chart',
  'Alert', 'Sonner', 'Toast', 'Toaster', 'Resizable', 'AspectRatio',
  'Collapsible', 'Sidebar'
];

// Utility to recursively find all TypeScript/TSX files
function findFiles(dir, pattern = /\.(ts|tsx)$/, excludeDirs = ['node_modules', '.git', 'dist', 'build']) {
  let results = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          results = results.concat(findFiles(fullPath, pattern, excludeDirs));
        }
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }

  return results;
}

// Extract imports from a file
function extractImports(content, componentName) {
  const imports = [];

  // Pattern 1: import { Component } from '@/components/ui/...'
  const namedImportRegex = new RegExp(
    `import\\s+{[^}]*\\b${componentName}\\b[^}]*}\\s+from\\s+['"](@/components/ui/[^'"]+)['"]`,
    'gm'
  );

  // Pattern 2: import Component from '@/components/ui/...'
  const defaultImportRegex = new RegExp(
    `import\\s+${componentName}\\s+from\\s+['"](@/components/ui/[^'"]+)['"]`,
    'gm'
  );

  // Pattern 3: import * as X from '@/components/ui/...' (for nested components like Select.Item)
  const namespaceImportRegex = new RegExp(
    `import\\s+\\*\\s+as\\s+(\\w+)\\s+from\\s+['"](@/components/ui/[^'"]+)['"]`,
    'gm'
  );

  let match;
  while ((match = namedImportRegex.exec(content)) !== null) {
    imports.push({ type: 'named', source: match[1], match: match[0] });
  }

  while ((match = defaultImportRegex.exec(content)) !== null) {
    imports.push({ type: 'default', source: match[1], match: match[0] });
  }

  while ((match = namespaceImportRegex.exec(content)) !== null) {
    imports.push({ type: 'namespace', alias: match[1], source: match[2], match: match[0] });
  }

  return imports;
}

// Extract JSX usages of a component
function extractJSXUsages(content, componentName, filePath) {
  const usages = [];
  const lines = content.split('\n');

  // Pattern 1: <Component ...>
  const openTagRegex = new RegExp(`<${componentName}[\\s>/]`, 'g');

  // Pattern 2: Namespace usage like Select.Item
  const namespaceUsageRegex = new RegExp(`<(\\w+)\\.${componentName}[\\s>/]`, 'g');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for direct usage
    if (openTagRegex.test(line)) {
      const context = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join('\n');

      // Extract props (basic heuristic)
      const propsMatch = line.match(new RegExp(`<${componentName}\\s+([^>]+)>?`));
      const propsString = propsMatch ? propsMatch[1] : '';
      const props = extractProps(propsString);

      usages.push({
        file: path.relative(ROOT_DIR, filePath),
        line: lineNumber,
        usage: line.trim(),
        props,
        context,
        type: 'direct'
      });

      openTagRegex.lastIndex = 0; // Reset regex
    }

    // Check for namespace usage
    let nsMatch;
    while ((nsMatch = namespaceUsageRegex.exec(line)) !== null) {
      const context = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join('\n');
      const namespace = nsMatch[1];

      usages.push({
        file: path.relative(ROOT_DIR, filePath),
        line: lineNumber,
        usage: line.trim(),
        props: [],
        context,
        type: 'namespace',
        namespace
      });
    }
  });

  return usages;
}

// Extract props from a props string (basic parsing)
function extractProps(propsString) {
  const props = [];

  // Match prop="value" or prop={value}
  const propRegex = /(\w+)(?:=(?:"[^"]*"|{[^}]*}))?/g;
  let match;

  while ((match = propRegex.exec(propsString)) !== null) {
    if (match[1] && match[1] !== 'className') { // Ignore className for now
      props.push(match[1]);
    }
  }

  return props;
}

// Check if file is related to RJSF
function isRJSFRelated(filePath, content) {
  const rjsfIndicators = [
    'react-jsonschema-form',
    '@rjsf',
    'customWidgets',
    'customFields',
    'uiSchema',
    'JSONSchema',
    'FieldTemplate',
    'ObjectFieldTemplate',
    'ArrayFieldTemplate'
  ];

  return rjsfIndicators.some(indicator =>
    filePath.includes(indicator) || content.includes(indicator)
  );
}

// Determine if a component is domain-specific
function isDomainComponent(componentPath) {
  const domainIndicators = [
    '/env-vars/',
    '/environments/',
    '/framework/',
    '/api/',
    '/docs/',
    '/team/',
    '/protection/',
    '/paths/',
    'environment-',
    'permission-',
    'framework-',
    'team-',
    'protection-',
    'path-',
    'code-reference',
    'documentation-link'
  ];

  return domainIndicators.some(indicator => componentPath.includes(indicator));
}

// Analyze a single component
function analyzeComponent(componentName) {
  console.log(`Analyzing component: ${componentName}...`);

  const analysis = {
    component: componentName,
    total_usages: 0,
    files_affected: 0,
    locations: [],
    unique_props: new Set(),
    prop_combinations: {},
    rjsf_usages: [],
    import_sources: new Set(),
    dependencies: new Set()
  };

  // Find all TypeScript/TSX files except in ui directory (to avoid self-references)
  const files = findFiles(path.join(ROOT_DIR, 'src'))
    .filter(f => !f.includes('.stories.') && !f.includes('.test.') && !f.includes('.spec.'));

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for imports
      const imports = extractImports(content, componentName);
      if (imports.length === 0) continue; // Skip if component not imported

      imports.forEach(imp => analysis.import_sources.add(imp.source));

      // Extract usages
      const usages = extractJSXUsages(content, componentName, filePath);

      if (usages.length > 0) {
        analysis.total_usages += usages.length;
        analysis.locations.push(...usages);

        // Track props
        usages.forEach(usage => {
          usage.props.forEach(prop => analysis.unique_props.add(prop));

          const propKey = usage.props.sort().join(',');
          if (propKey) {
            analysis.prop_combinations[propKey] = (analysis.prop_combinations[propKey] || 0) + 1;
          }
        });

        // Check if RJSF related
        if (isRJSFRelated(filePath, content)) {
          analysis.rjsf_usages.push(...usages);
        }
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err.message);
    }
  }

  analysis.files_affected = new Set(analysis.locations.map(loc => loc.file)).size;
  analysis.unique_props = Array.from(analysis.unique_props);
  analysis.import_sources = Array.from(analysis.import_sources);
  analysis.is_used_in_rjsf = analysis.rjsf_usages.length > 0;

  return analysis;
}

// Catalog all components in the ui directory
function catalogUIComponents() {
  const uiDir = path.join(ROOT_DIR, 'src', 'components', 'ui');
  const components = [];

  function scanDirectory(dir, basePath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          scanDirectory(fullPath, relativePath);
        } else if (entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.includes('.stories.')) {
          const componentPath = relativePath.replace('.tsx', '');
          const isDomain = isDomainComponent(componentPath);

          components.push({
            name: path.basename(componentPath),
            path: relativePath,
            fullPath: path.relative(ROOT_DIR, fullPath),
            isDomain,
            category: isDomain ? 'domain-specific' : 'generic-ui'
          });
        }
      }
    } catch (err) {
      console.error(`Error scanning directory ${dir}:`, err.message);
    }
  }

  scanDirectory(uiDir);
  return components;
}

// Main execution
async function main() {
  console.log('Starting comprehensive UI component audit...\n');

  const startTime = Date.now();

  // Step 1: Catalog all UI components
  console.log('Step 1: Cataloging UI components...');
  const componentCatalog = catalogUIComponents();
  console.log(`Found ${componentCatalog.length} components in ui directory\n`);

  // Step 2: Analyze each generic UI component
  console.log('Step 2: Analyzing generic UI components...');
  const analyses = [];

  for (const componentName of GENERIC_UI_COMPONENTS) {
    const analysis = analyzeComponent(componentName);
    if (analysis.total_usages > 0) {
      analyses.push(analysis);
    }
  }

  console.log(`\nAnalyzed ${analyses.length} components with usages\n`);

  // Step 3: Generate summary
  const summary = {
    total_components_analyzed: GENERIC_UI_COMPONENTS.length,
    components_in_use: analyses.length,
    components_not_used: GENERIC_UI_COMPONENTS.length - analyses.length,
    total_usages: analyses.reduce((sum, a) => sum + a.total_usages, 0),
    files_affected: new Set(analyses.flatMap(a => a.locations.map(l => l.file))).size,
    rjsf_components: analyses.filter(a => a.is_used_in_rjsf).length,
    domain_components_count: componentCatalog.filter(c => c.isDomain).length,
    generic_components_count: componentCatalog.filter(c => !c.isDomain).length
  };

  // Step 4: Generate report
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime,
      root_directory: ROOT_DIR
    },
    summary,
    component_catalog: componentCatalog,
    component_analyses: analyses.sort((a, b) => b.total_usages - a.total_usages),
    recommendations: generateRecommendations(analyses, componentCatalog)
  };

  // Step 5: Write report
  const outputPath = path.join(__dirname, 'phase1-usage-audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total usages found: ${summary.total_usages}`);
  console.log(`Files affected: ${summary.files_affected}`);
  console.log(`Components in use: ${summary.components_in_use}/${summary.total_components_analyzed}`);
  console.log(`RJSF-integrated components: ${summary.rjsf_components}`);
  console.log(`Domain components: ${summary.domain_components_count}`);
  console.log(`\nReport written to: ${outputPath}`);
  console.log('='.repeat(60));
}

// Generate recommendations based on analysis
function generateRecommendations(analyses, catalog) {
  const recommendations = {
    safe_to_remove: [],
    requires_migration: [],
    domain_specific_keep: [],
    rjsf_critical: []
  };

  // Components with no usages - safe to remove
  const usedComponents = new Set(analyses.map(a => a.component.toLowerCase()));
  GENERIC_UI_COMPONENTS.forEach(comp => {
    if (!usedComponents.has(comp.toLowerCase())) {
      recommendations.safe_to_remove.push({
        component: comp,
        reason: 'No usages found in codebase'
      });
    }
  });

  // Components requiring migration
  analyses.forEach(analysis => {
    if (analysis.total_usages > 0 && !analysis.is_used_in_rjsf) {
      recommendations.requires_migration.push({
        component: analysis.component,
        usages: analysis.total_usages,
        files: analysis.files_affected,
        priority: analysis.total_usages > 50 ? 'high' : analysis.total_usages > 20 ? 'medium' : 'low'
      });
    }
  });

  // RJSF critical components
  analyses.forEach(analysis => {
    if (analysis.is_used_in_rjsf) {
      recommendations.rjsf_critical.push({
        component: analysis.component,
        rjsf_usages: analysis.rjsf_usages.length,
        warning: 'Requires careful RJSF widget migration'
      });
    }
  });

  // Domain-specific components to keep
  catalog.filter(c => c.isDomain).forEach(comp => {
    recommendations.domain_specific_keep.push({
      component: comp.name,
      path: comp.path,
      reason: 'Contains domain-specific business logic'
    });
  });

  return recommendations;
}

// Run the audit
main().catch(err => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});

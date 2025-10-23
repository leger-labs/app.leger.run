#!/usr/bin/env node
/**
 * Phase 2: Domain Component Identification
 *
 * Categorizes all components into:
 * 1. KEEP - Domain-specific components with business logic
 * 2. DELETE - Generic UI wrappers that should be replaced with direct Radix + Tailwind
 * 3. REVIEW - Components that need manual review
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load Phase 1 results
const phase1Audit = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'phase1-usage-audit.json'), 'utf-8')
);

const phase1Deps = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'phase1-2-dependency-map.json'), 'utf-8')
);

const phase1RJSF = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'phase1-3-rjsf-analysis.json'), 'utf-8')
);

// Domain component patterns (KEEP)
const DOMAIN_INDICATORS = [
  // Environment management
  { pattern: /environment-?/i, category: 'Environment Management' },
  { pattern: /env-?var/i, category: 'Environment Management' },

  // API/Permission management
  { pattern: /permission/i, category: 'API Management' },
  { pattern: /api-?/i, category: 'API Management' },

  // Framework/Build
  { pattern: /framework/i, category: 'Framework Configuration' },
  { pattern: /preset/i, category: 'Framework Configuration' },
  { pattern: /command-?field/i, category: 'Framework Configuration' },

  // Team management
  { pattern: /team/i, category: 'Team Management' },

  // Protection/Security
  { pattern: /protection/i, category: 'Security' },
  { pattern: /plan-?restricted/i, category: 'Security' },

  // Path management
  { pattern: /path-?management/i, category: 'Path Management' },

  // Documentation
  { pattern: /documentation-?link/i, category: 'Documentation' },
  { pattern: /code-?reference/i, category: 'Documentation' },

  // Form wrappers (domain logic)
  { pattern: /overrideable-?field/i, category: 'Form Logic' },
  { pattern: /conditional-?field/i, category: 'Form Logic' },

  // Feedback components (domain logic)
  { pattern: /save-?button/i, category: 'Form Feedback' },
  { pattern: /dangerous-?action/i, category: 'Form Feedback' },
  { pattern: /validation-?summary/i, category: 'Form Feedback' },
  { pattern: /field-?status/i, category: 'Form Feedback' },
  { pattern: /export-?readiness/i, category: 'Form Feedback' },
  { pattern: /visibility-?notice/i, category: 'Form Feedback' },
  { pattern: /character-?counter/i, category: 'Form Feedback' },
  { pattern: /enhanced-?validation/i, category: 'Form Feedback' },

  // RJSF field components (domain logic - complex field behavior)
  { pattern: /array-?field/i, category: 'RJSF Fields' },
  { pattern: /object-?field/i, category: 'RJSF Fields' },
  { pattern: /select-?field/i, category: 'RJSF Fields' },
  { pattern: /text-?field/i, category: 'RJSF Fields' },
  { pattern: /secret-?field/i, category: 'RJSF Fields' },
  { pattern: /date-?field/i, category: 'RJSF Fields' },
  { pattern: /toggle-?field/i, category: 'RJSF Fields' },
  { pattern: /integer-?field/i, category: 'RJSF Fields' },
  { pattern: /number-?field/i, category: 'RJSF Fields' },
  { pattern: /markdown-?text-?area/i, category: 'RJSF Fields' },
  { pattern: /url-?input/i, category: 'RJSF Fields' },
  { pattern: /same-?information-?checkbox/i, category: 'RJSF Fields' },

  // Layout components with domain logic
  { pattern: /import-?controls/i, category: 'Import/Export' },
  { pattern: /export-?controls/i, category: 'Import/Export' },
  { pattern: /enhanced-?export/i, category: 'Import/Export' },
  { pattern: /config-?form/i, category: 'Configuration' },
  { pattern: /raw-?editor/i, category: 'Configuration' }
];

// Generic UI component patterns (DELETE)
const GENERIC_UI_PATTERNS = [
  'button.tsx',
  'input.tsx',
  'textarea.tsx',
  'select.tsx',
  'checkbox.tsx',
  'radio-group.tsx',
  'switch.tsx',
  'label.tsx',
  'form.tsx',
  'card.tsx',
  'accordion.tsx',
  'tabs.tsx',
  'dialog.tsx',
  'alert-dialog.tsx',
  'sheet.tsx',
  'popover.tsx',
  'tooltip.tsx',
  'hover-card.tsx',
  'drawer.tsx',
  'table.tsx',
  'badge.tsx',
  'avatar.tsx',
  'calendar.tsx',
  'progress.tsx',
  'skeleton.tsx',
  'separator.tsx',
  'scroll-area.tsx',
  'dropdown-menu.tsx',
  'context-menu.tsx',
  'navigation-menu.tsx',
  'menubar.tsx',
  'breadcrumb.tsx',
  'pagination.tsx',
  'slider.tsx',
  'toggle.tsx',
  'toggle-group.tsx',
  'command.tsx',
  'input-otp.tsx',
  'carousel.tsx',
  'chart.tsx',
  'alert.tsx',
  'sonner.tsx',
  'toast.tsx',
  'toaster.tsx',
  'resizable.tsx',
  'aspect-ratio.tsx',
  'collapsible.tsx',
  'sidebar.tsx'
];

// Categorize a component
function categorizeComponent(component) {
  const componentPath = component.path.toLowerCase();
  const componentName = component.name.toLowerCase();

  // Check if it's a story file (always exclude)
  if (componentPath.includes('.stories.')) {
    return { category: 'EXCLUDE', reason: 'Story file', subcategory: 'Stories' };
  }

  // Check if it's a domain component
  for (const indicator of DOMAIN_INDICATORS) {
    if (indicator.pattern.test(componentName) || indicator.pattern.test(componentPath)) {
      return {
        category: 'KEEP',
        reason: 'Domain-specific component with business logic',
        subcategory: indicator.category
      };
    }
  }

  // Check if it's a generic UI component
  for (const pattern of GENERIC_UI_PATTERNS) {
    if (componentPath.endsWith(pattern)) {
      return {
        category: 'DELETE',
        reason: 'Generic UI wrapper - replace with direct Radix + Tailwind',
        subcategory: 'Generic UI Primitive'
      };
    }
  }

  // Check if it's in a domain-specific directory
  const domainDirectories = [
    'env-vars',
    'environments',
    'framework',
    'api',
    'docs',
    'team',
    'protection',
    'path-management',
    'form/fields',
    'form/feedback',
    'form/wrappers'
  ];

  for (const dir of domainDirectories) {
    if (componentPath.includes(`/${dir}/`)) {
      return {
        category: 'KEEP',
        reason: 'Located in domain-specific directory',
        subcategory: dir.split('/').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      };
    }
  }

  // Default to REVIEW
  return {
    category: 'REVIEW',
    reason: 'Needs manual review to determine if domain-specific or generic',
    subcategory: 'Unknown'
  };
}

// Analyze component complexity
function analyzeComplexity(componentPath) {
  if (!fs.existsSync(componentPath)) {
    return { lines: 0, hasBusinessLogic: false, hasStateManagement: false };
  }

  const content = fs.readFileSync(componentPath, 'utf-8');
  const lines = content.split('\n').length;

  // Check for business logic indicators
  const businessLogicIndicators = [
    /fetch\s*\(/,
    /axios\./,
    /apiClient\./,
    /useQuery/,
    /useMutation/,
    /\.filter\(/,
    /\.map\(/,
    /\.reduce\(/,
    /if\s*\(/,
    /switch\s*\(/,
    /\.sort\(/,
    /localStorage/,
    /sessionStorage/,
    /cookies/
  ];

  const hasBusinessLogic = businessLogicIndicators.some(pattern => pattern.test(content));

  // Check for state management
  const stateIndicators = [
    /useState/,
    /useReducer/,
    /useContext/,
    /useEffect/,
    /useCallback/,
    /useMemo/
  ];

  const hasStateManagement = stateIndicators.some(pattern => pattern.test(content));

  return { lines, hasBusinessLogic, hasStateManagement };
}

// Main execution
async function main() {
  console.log('Phase 2: Categorizing components...\n');

  const categorization = {
    metadata: {
      timestamp: new Date().toISOString(),
      total_components: phase1Audit.component_catalog.length
    },
    components: [],
    summary: {
      keep: 0,
      delete: 0,
      review: 0,
      exclude: 0
    },
    by_category: {}
  };

  // Categorize each component
  for (const component of phase1Audit.component_catalog) {
    const fullPath = path.join(ROOT_DIR, 'src', 'components', 'ui', component.path);
    const result = categorizeComponent(component);
    const complexity = analyzeComplexity(fullPath);

    // Check if component has usages
    const usageAnalysis = phase1Audit.component_analyses.find(
      a => a.component.toLowerCase() === component.name.toLowerCase()
    );

    const categorized = {
      name: component.name,
      path: component.path,
      fullPath: path.relative(ROOT_DIR, fullPath),
      ...result,
      complexity,
      hasUsages: usageAnalysis ? usageAnalysis.total_usages > 0 : false,
      usageCount: usageAnalysis ? usageAnalysis.total_usages : 0,
      filesAffected: usageAnalysis ? usageAnalysis.files_affected : 0,
      isRJSFCritical: phase1RJSF.recommendations.critical_components.some(
        c => c.component.toLowerCase() === component.name.toLowerCase()
      )
    };

    categorization.components.push(categorized);
    categorization.summary[result.category.toLowerCase()]++;

    // Group by subcategory
    if (!categorization.by_category[result.subcategory]) {
      categorization.by_category[result.subcategory] = [];
    }
    categorization.by_category[result.subcategory].push(categorized);

    console.log(`${result.category.padEnd(8)} - ${component.name.padEnd(40)} (${result.subcategory})`);
  }

  // Generate recommendations
  categorization.recommendations = {
    immediate_deletion: categorization.components.filter(
      c => c.category === 'DELETE' && !c.hasUsages
    ).map(c => ({
      component: c.name,
      path: c.path,
      reason: 'No usages found - safe to delete immediately'
    })),

    requires_migration: categorization.components.filter(
      c => c.category === 'DELETE' && c.hasUsages
    ).map(c => ({
      component: c.name,
      path: c.path,
      usages: c.usageCount,
      files: c.filesAffected,
      isRJSFCritical: c.isRJSFCritical,
      priority: c.isRJSFCritical ? 'HIGH - RJSF Critical'
        : c.usageCount > 20 ? 'HIGH'
        : c.usageCount > 5 ? 'MEDIUM'
        : 'LOW'
    })),

    keep_components: categorization.components.filter(
      c => c.category === 'KEEP'
    ).map(c => ({
      component: c.name,
      path: c.path,
      category: c.subcategory,
      complexity: `${c.complexity.lines} lines`,
      hasBusinessLogic: c.complexity.hasBusinessLogic,
      hasStateManagement: c.complexity.hasStateManagement
    })),

    needs_review: categorization.components.filter(
      c => c.category === 'REVIEW'
    ).map(c => ({
      component: c.name,
      path: c.path,
      complexity: `${c.complexity.lines} lines`,
      hasUsages: c.hasUsages,
      usageCount: c.usageCount
    }))
  };

  // Write report
  const outputPath = path.join(__dirname, 'phase2-categorization.json');
  fs.writeFileSync(outputPath, JSON.stringify(categorization, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log('CATEGORIZATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total components: ${categorization.metadata.total_components}`);
  console.log(`KEEP (domain-specific): ${categorization.summary.keep}`);
  console.log(`DELETE (generic UI): ${categorization.summary.delete}`);
  console.log(`REVIEW (manual check): ${categorization.summary.review}`);
  console.log(`EXCLUDE (stories): ${categorization.summary.exclude}`);
  console.log(`\nImmediate deletion candidates: ${categorization.recommendations.immediate_deletion.length}`);
  console.log(`Requires migration: ${categorization.recommendations.requires_migration.length}`);
  console.log(`\nReport written to: ${outputPath}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error during categorization:', err);
  process.exit(1);
});

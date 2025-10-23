#!/usr/bin/env node
/**
 * Phase 3: Migration Strategy
 *
 * Creates a detailed migration plan for each component:
 * 1. Component-by-component migration steps
 * 2. Priority ordering (leaf nodes first)
 * 3. Code transformation patterns
 * 4. RJSF-specific migration steps
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load previous phase results
const phase1Audit = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'phase1-usage-audit.json'), 'utf-8')
);

const phase2Cat = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'phase2-categorization.json'), 'utf-8')
);

const phase1RJSF = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'phase1-3-rjsf-analysis.json'), 'utf-8')
);

// Migration patterns for common components
const MIGRATION_PATTERNS = {
  Button: {
    before: `import { Button } from "@/components/ui/button"`,
    after: `import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)`,
    usage_before: `<Button variant="destructive" size="lg" onClick={handleClick}>
  Delete
</Button>`,
    usage_after: `<button
  className={cn(buttonVariants({ variant: "destructive", size: "lg" }))}
  onClick={handleClick}
>
  Delete
</button>`,
    notes: [
      'Move buttonVariants to @/lib/ui-patterns.ts for reuse',
      'Use <Slot> for asChild pattern if needed',
      'Preserve all event handlers and aria attributes'
    ]
  },

  Input: {
    before: `import { Input } from "@/components/ui/input"`,
    after: `import { cn } from "@/lib/utils"

const inputStyles = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
  "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "md:text-sm"
)`,
    usage_before: `<Input
  type="text"
  placeholder="Enter name"
  value={value}
  onChange={onChange}
/>`,
    usage_after: `<input
  className={inputStyles}
  type="text"
  placeholder="Enter name"
  value={value}
  onChange={onChange}
/>`,
    notes: [
      'Move inputStyles to @/lib/ui-patterns.ts for reuse',
      'Preserve all input attributes (type, value, onChange, etc.)',
      'Check for custom className and merge with cn()'
    ]
  },

  Label: {
    before: `import { Label } from "@/components/ui/label"`,
    after: `import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

const labelStyles = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"`,
    usage_before: `<Label htmlFor="name">Name</Label>`,
    usage_after: `<LabelPrimitive.Root
  htmlFor="name"
  className={labelStyles}
>
  Name
</LabelPrimitive.Root>`,
    notes: [
      'Label is a Radix primitive, keep using Radix',
      'Just inline the styles instead of wrapper component',
      'Preserve htmlFor and other attributes'
    ]
  },

  Card: {
    before: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"`,
    after: `import { cn } from "@/lib/utils"

const cardStyles = "rounded-xl border bg-card text-card-foreground shadow"
const cardHeaderStyles = "flex flex-col space-y-1.5 p-6"
const cardTitleStyles = "font-semibold leading-none tracking-tight"
const cardDescriptionStyles = "text-sm text-muted-foreground"
const cardContentStyles = "p-6 pt-0"
const cardFooterStyles = "flex items-center p-6 pt-0"`,
    usage_before: `<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Footer
  </CardFooter>
</Card>`,
    usage_after: `<div className={cardStyles}>
  <div className={cardHeaderStyles}>
    <h3 className={cardTitleStyles}>Title</h3>
    <p className={cardDescriptionStyles}>Description</p>
  </div>
  <div className={cardContentStyles}>
    Content here
  </div>
  <div className={cardFooterStyles}>
    Footer
  </div>
</div>`,
    notes: [
      'Card is just styled divs - easy migration',
      'Move styles to @/lib/ui-patterns.ts',
      'Preserve any custom className props'
    ]
  },

  Select: {
    before: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"`,
    after: `import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const selectTriggerStyles = cn(
  "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background",
  "placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-1 focus:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "[&>span]:line-clamp-1"
)`,
    usage_before: `<Select value={value} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>`,
    usage_after: `<SelectPrimitive.Root value={value} onValueChange={onChange}>
  <SelectPrimitive.Trigger className={selectTriggerStyles}>
    <SelectPrimitive.Value placeholder="Select..." />
    <SelectPrimitive.Icon>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content className="...">
      <SelectPrimitive.Viewport>
        <SelectPrimitive.Item value="option1" className="...">
          <SelectPrimitive.ItemText>Option 1</SelectPrimitive.ItemText>
          <SelectPrimitive.ItemIndicator>
            <Check className="h-4 w-4" />
          </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
        <SelectPrimitive.Item value="option2" className="...">
          <SelectPrimitive.ItemText>Option 2</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
</SelectPrimitive.Root>`,
    notes: [
      'Select is complex - create reusable pattern in ui-patterns.ts',
      'Preserve all Radix props (value, onValueChange, etc.)',
      'This is RJSF-critical - test all forms after migration'
    ]
  },

  Badge: {
    before: `import { Badge } from "@/components/ui/badge"`,
    after: `import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)`,
    usage_before: `<Badge variant="secondary">New</Badge>`,
    usage_after: `<span className={cn(badgeVariants({ variant: "secondary" }))}>
  New
</span>`,
    notes: [
      'Badge is just a styled span - simple migration',
      'Move badgeVariants to @/lib/ui-patterns.ts'
    ]
  }
};

// Generate migration plan for a component
function generateMigrationPlan(component) {
  const analysis = phase1Audit.component_analyses.find(
    a => a.component.toLowerCase() === component.name.toLowerCase()
  );

  if (!analysis) {
    return null; // Component has no usages
  }

  const isRJSFCritical = phase1RJSF.recommendations.critical_components.some(
    c => c.component.toLowerCase() === component.name.toLowerCase()
  );

  const pattern = MIGRATION_PATTERNS[component.name];

  return {
    component: component.name,
    priority: isRJSFCritical ? 'CRITICAL'
      : analysis.total_usages > 20 ? 'HIGH'
      : analysis.total_usages > 5 ? 'MEDIUM'
      : 'LOW',
    usages: analysis.total_usages,
    files_affected: analysis.files_affected,
    is_rjsf_critical: isRJSFCritical,
    rjsf_files: isRJSFCritical
      ? phase1RJSF.recommendations.critical_components.find(
          c => c.component === component.name
        )?.files || []
      : [],
    migration_pattern: pattern || {
      notes: ['No predefined pattern - needs custom migration strategy']
    },
    steps: [
      {
        step: 1,
        action: 'Create style pattern',
        description: `Extract styles/variants from ${component.path} to @/lib/ui-patterns.ts`,
        verification: 'Pattern is reusable across multiple files'
      },
      {
        step: 2,
        action: 'Update first usage file',
        description: 'Replace component import with direct Radix + pattern',
        verification: 'File compiles without errors, UI looks identical'
      },
      {
        step: 3,
        action: 'Update all usage files',
        description: `Apply same transformation to all ${analysis.files_affected} files`,
        verification: 'All files compile, visual regression tests pass'
      },
      {
        step: 4,
        action: 'Test RJSF forms',
        description: isRJSFCritical
          ? 'Test all forms that use this component - especially validation and submission'
          : 'N/A - not used in RJSF',
        verification: isRJSFCritical
          ? 'All forms work identically to before'
          : 'N/A'
      },
      {
        step: 5,
        action: 'Delete component file',
        description: `Remove src/components/ui/${component.path}`,
        verification: 'Build succeeds, no import errors'
      }
    ],
    risks: [
      isRJSFCritical ? 'HIGH: Used in RJSF - form breakage risk' : null,
      analysis.total_usages > 20 ? 'MEDIUM: High usage count - many files to update' : null,
      'TypeScript prop types may differ - check all usages'
    ].filter(Boolean),
    rollback_plan: `git revert <commit-hash> to restore ${component.path}`
  };
}

// Determine migration order
function determineMigrationOrder(components) {
  // Group by priority and dependency depth
  const deleteComponents = components.filter(c => c.category === 'DELETE');

  const withPlans = deleteComponents
    .map(c => {
      const plan = generateMigrationPlan(c);
      return plan ? { ...c, plan } : null;
    })
    .filter(Boolean);

  // Sort by:
  // 1. Non-RJSF components first (lower risk)
  // 2. Lower usage count first (easier)
  // 3. Alphabetical
  const sortedNonRJSF = withPlans
    .filter(c => !c.plan.is_rjsf_critical)
    .sort((a, b) => a.plan.usages - b.plan.usages);

  const sortedRJSF = withPlans
    .filter(c => c.plan.is_rjsf_critical)
    .sort((a, b) => a.plan.usages - b.plan.usages);

  return {
    batch_1_low_risk: sortedNonRJSF.filter(c => c.plan.usages <= 5),
    batch_2_medium_risk: sortedNonRJSF.filter(c => c.plan.usages > 5 && c.plan.usages <= 20),
    batch_3_high_usage: sortedNonRJSF.filter(c => c.plan.usages > 20),
    batch_4_rjsf_critical: sortedRJSF
  };
}

// Main execution
async function main() {
  console.log('Phase 3: Generating migration strategy...\n');

  const deleteComponents = phase2Cat.components.filter(c => c.category === 'DELETE');
  console.log(`Generating plans for ${deleteComponents.length} components to delete\n`);

  const migrationOrder = determineMigrationOrder(phase2Cat.components);

  const strategy = {
    metadata: {
      timestamp: new Date().toISOString(),
      total_components_to_migrate: deleteComponents.length
    },
    migration_batches: {
      batch_1_low_risk: {
        description: 'Start with these - low usage, not in RJSF',
        components: migrationOrder.batch_1_low_risk.map(c => c.plan),
        estimated_effort: `${migrationOrder.batch_1_low_risk.length} × 30min = ${migrationOrder.batch_1_low_risk.length * 0.5}h`
      },
      batch_2_medium_risk: {
        description: 'Medium usage, not in RJSF',
        components: migrationOrder.batch_2_medium_risk.map(c => c.plan),
        estimated_effort: `${migrationOrder.batch_2_medium_risk.length} × 1h = ${migrationOrder.batch_2_medium_risk.length}h`
      },
      batch_3_high_usage: {
        description: 'High usage, not in RJSF - requires careful testing',
        components: migrationOrder.batch_3_high_usage.map(c => c.plan),
        estimated_effort: `${migrationOrder.batch_3_high_usage.length} × 2h = ${migrationOrder.batch_3_high_usage.length * 2}h`
      },
      batch_4_rjsf_critical: {
        description: 'CRITICAL: Used in RJSF forms - migrate last, test thoroughly',
        components: migrationOrder.batch_4_rjsf_critical.map(c => c.plan),
        estimated_effort: `${migrationOrder.batch_4_rjsf_critical.length} × 3h = ${migrationOrder.batch_4_rjsf_critical.length * 3}h`
      }
    },
    global_migration_steps: [
      {
        phase: 'Preparation',
        tasks: [
          'Create @/lib/ui-patterns.ts file',
          'Set up visual regression testing (Percy/Chromatic)',
          'Create backup branch',
          'Document current test coverage'
        ]
      },
      {
        phase: 'Batch 1 - Low Risk',
        tasks: [
          'Migrate components with ≤5 usages',
          'Create PR per component or small groups',
          'Get visual regression baseline',
          'Merge when tests pass'
        ]
      },
      {
        phase: 'Batch 2 - Medium Risk',
        tasks: [
          'Migrate components with 6-20 usages',
          'Run full test suite after each',
          'Check bundle size impact',
          'Merge when verified'
        ]
      },
      {
        phase: 'Batch 3 - High Usage',
        tasks: [
          'Migrate components with >20 usages',
          'Extra careful with Button, Label',
          'Run smoke tests on all pages',
          'Merge with caution'
        ]
      },
      {
        phase: 'Batch 4 - RJSF Critical',
        tasks: [
          'Test all forms in isolation first',
          'Migrate Input, Label, Select, etc.',
          'Test form submission, validation',
          'Test all custom widgets',
          'Only merge after ALL forms verified'
        ]
      },
      {
        phase: 'Cleanup',
        tasks: [
          'Remove all unused component files',
          'Update documentation',
          'Remove related imports from package.json if any',
          'Run final bundle analysis'
        ]
      }
    ],
    pre_migration_checklist: [
      '✓ All tests passing',
      '✓ Visual regression baseline captured',
      '✓ Backup branch created',
      '✓ @/lib/ui-patterns.ts created',
      '✓ Team notified of migration',
      '✓ Rollback plan documented'
    ],
    post_migration_validation: [
      '✓ All TypeScript errors resolved',
      '✓ All tests passing',
      '✓ Visual regression tests pass',
      '✓ All RJSF forms tested manually',
      '✓ Bundle size reduced',
      '✓ No console errors',
      '✓ Accessibility audit passes'
    ]
  };

  // Write report
  const outputPath = path.join(__dirname, 'phase3-migration-strategy.json');
  fs.writeFileSync(outputPath, JSON.stringify(strategy, null, 2));

  const totalEffort =
    migrationOrder.batch_1_low_risk.length * 0.5 +
    migrationOrder.batch_2_medium_risk.length * 1 +
    migrationOrder.batch_3_high_usage.length * 2 +
    migrationOrder.batch_4_rjsf_critical.length * 3;

  console.log(`\n${'='.repeat(60)}`);
  console.log('MIGRATION STRATEGY COMPLETE');
  console.log('='.repeat(60));
  console.log(`Batch 1 (Low Risk): ${migrationOrder.batch_1_low_risk.length} components`);
  console.log(`Batch 2 (Medium Risk): ${migrationOrder.batch_2_medium_risk.length} components`);
  console.log(`Batch 3 (High Usage): ${migrationOrder.batch_3_high_usage.length} components`);
  console.log(`Batch 4 (RJSF Critical): ${migrationOrder.batch_4_rjsf_critical.length} components`);
  console.log(`\nEstimated total effort: ${totalEffort.toFixed(1)} hours`);
  console.log(`\nReport written to: ${outputPath}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error during migration strategy:', err);
  process.exit(1);
});

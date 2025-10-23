# Developer Guide: Post-Migration UI Development

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [UI Pattern Library](#ui-pattern-library)
4. [Common Patterns](#common-patterns)
5. [RJSF Integration](#rjsf-integration)
6. [When to Create Components](#when-to-create-components)
7. [Migration Reference](#migration-reference)
8. [Troubleshooting](#troubleshooting)

---

## Overview

After the UI component migration, this codebase no longer uses custom wrapper components for generic UI primitives. Instead, we use:

1. **Direct Radix UI primitives** for complex interactive components
2. **Tailwind utility classes** for styling
3. **CVA (Class Variance Authority)** for variant management
4. **Shared style patterns** in `@/lib/ui-patterns.ts` for reusability

### What Changed

**Before Migration:**
```tsx
import { Button } from "@/components/ui/button"
<Button variant="destructive">Delete</Button>
```

**After Migration:**
```tsx
import { buttonVariants } from "@/lib/ui-patterns"
<button className={cn(buttonVariants({ variant: "destructive" }))}>
  Delete
</button>
```

### Why This Approach

**Benefits:**
- ✅ Reduced bundle size (no wrapper overhead)
- ✅ Explicit styling (visible in code)
- ✅ Easier debugging (direct DOM elements)
- ✅ Better tree-shaking (import only what you use)
- ✅ Simpler maintenance (one less abstraction layer)

**Trade-offs:**
- ⚠️ More verbose (explicit className calls)
- ⚠️ Less abstraction (duplicate styles if not using patterns)

---

## Core Principles

### 1. Use Direct DOM Elements for Simple UI

For simple elements with no complex behavior:

```tsx
// ✅ GOOD: Direct DOM element + utility classes
<div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
  <h3 className="font-semibold leading-none tracking-tight">Title</h3>
  <p className="text-sm text-muted-foreground mt-2">Description</p>
</div>

// ❌ BAD: Creating a wrapper component for simple styling
// DON'T create components/ui/card.tsx just for these styles
```

### 2. Use Radix Primitives for Complex Interactions

For components with complex accessibility or interaction patterns:

```tsx
// ✅ GOOD: Use Radix directly
import * as Dialog from "@radix-ui/react-dialog"

<Dialog.Root>
  <Dialog.Trigger className="...">Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="..." />
    <Dialog.Content className="...">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### 3. Use Shared Patterns for Reusability

Extract common style patterns to `@/lib/ui-patterns.ts`:

```tsx
// @/lib/ui-patterns.ts
export const inputStyles = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1",
  "text-base shadow-sm transition-colors",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50"
)

// Usage in multiple files
import { inputStyles } from "@/lib/ui-patterns"
<input className={inputStyles} type="text" />
```

### 4. Use CVA for Variant Management

For components with multiple variants:

```tsx
import { cva } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Usage
<button className={cn(buttonVariants({ variant: "destructive", size: "lg" }))}>
  Delete
</button>
```

---

## UI Pattern Library

### Location: `src/lib/ui-patterns.ts`

This file contains all reusable style patterns. DO NOT create wrapper components for these.

```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ============================================================================
// BUTTONS
// ============================================================================

export const buttonVariants = cva(
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
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

// ============================================================================
// INPUTS
// ============================================================================

export const inputStyles = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
  "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "md:text-sm"
)

// ============================================================================
// BADGES
// ============================================================================

export const badgeVariants = cva(
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
)

export type BadgeVariants = VariantProps<typeof badgeVariants>

// ============================================================================
// CARDS
// ============================================================================

export const cardStyles = "rounded-xl border bg-card text-card-foreground shadow"
export const cardHeaderStyles = "flex flex-col space-y-1.5 p-6"
export const cardTitleStyles = "font-semibold leading-none tracking-tight"
export const cardDescriptionStyles = "text-sm text-muted-foreground"
export const cardContentStyles = "p-6 pt-0"
export const cardFooterStyles = "flex items-center p-6 pt-0"

// ============================================================================
// LABELS (Radix)
// ============================================================================

export const labelStyles = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"

// ============================================================================
// ALERTS
// ============================================================================

export const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export const alertTitleStyles = "mb-1 font-medium leading-none tracking-tight"
export const alertDescriptionStyles = "text-sm [&_p]:leading-relaxed"

// Add more patterns as needed...
```

---

## Common Patterns

### Buttons

```tsx
import { buttonVariants } from "@/lib/ui-patterns"
import { Slot } from "@radix-ui/react-slot"

// Standard button
<button className={cn(buttonVariants({ variant: "default" }))}>
  Click me
</button>

// With custom className
<button className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
  Custom spacing
</button>

// As child (asChild pattern)
<Slot className={cn(buttonVariants())}>
  <a href="/link">Link styled as button</a>
</Slot>

// Icon button
<button className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
  <IconComponent className="h-4 w-4" />
</button>
```

### Inputs

```tsx
import { inputStyles } from "@/lib/ui-patterns"

// Text input
<input
  className={inputStyles}
  type="text"
  placeholder="Enter name..."
  value={value}
  onChange={onChange}
/>

// With error state
<input
  className={cn(
    inputStyles,
    hasError && "border-destructive focus-visible:ring-destructive"
  )}
  type="text"
/>

// Disabled
<input
  className={inputStyles}
  type="text"
  disabled
/>
```

### Labels

```tsx
import * as Label from "@radix-ui/react-label"
import { labelStyles } from "@/lib/ui-patterns"

<Label.Root htmlFor="name" className={labelStyles}>
  Name
</Label.Root>
<input id="name" className={inputStyles} />
```

### Cards

```tsx
import {
  cardStyles,
  cardHeaderStyles,
  cardTitleStyles,
  cardDescriptionStyles,
  cardContentStyles,
  cardFooterStyles
} from "@/lib/ui-patterns"

<div className={cardStyles}>
  <div className={cardHeaderStyles}>
    <h3 className={cardTitleStyles}>Card Title</h3>
    <p className={cardDescriptionStyles}>Card description</p>
  </div>
  <div className={cardContentStyles}>
    <p>Card content goes here</p>
  </div>
  <div className={cardFooterStyles}>
    <button className={cn(buttonVariants())}>Action</button>
  </div>
</div>
```

### Badges

```tsx
import { badgeVariants } from "@/lib/ui-patterns"

<span className={cn(badgeVariants({ variant: "default" }))}>
  New
</span>

<span className={cn(badgeVariants({ variant: "destructive" }))}>
  Error
</span>

<span className={cn(badgeVariants({ variant: "outline" }))}>
  Outline
</span>
```

### Dialogs (Radix)

```tsx
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { buttonVariants } from "@/lib/ui-patterns"

<Dialog.Root>
  <Dialog.Trigger className={cn(buttonVariants())}>
    Open Dialog
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

    <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
      <div className="flex flex-col space-y-1.5 text-center sm:text-left">
        <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
          Dialog Title
        </Dialog.Title>
        <Dialog.Description className="text-sm text-muted-foreground">
          Dialog description
        </Dialog.Description>
      </div>

      <div className="py-4">
        {/* Dialog content */}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Dialog.Close className={cn(buttonVariants({ variant: "outline" }))}>
          Cancel
        </Dialog.Close>
        <button className={cn(buttonVariants())}>
          Confirm
        </button>
      </div>

      <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Select (Radix)

```tsx
import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

<Select.Root value={value} onValueChange={onChange}>
  <Select.Trigger className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
    <Select.Value placeholder="Select option..." />
    <Select.Icon>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Select.Icon>
  </Select.Trigger>

  <Select.Portal>
    <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
      <Select.Viewport className="p-1">
        <Select.Item
          value="option1"
          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <Select.ItemText>Option 1</Select.ItemText>
          <Select.ItemIndicator className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-4 w-4" />
          </Select.ItemIndicator>
        </Select.Item>

        <Select.Item value="option2" className="...">
          <Select.ItemText>Option 2</Select.ItemText>
        </Select.Item>
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

---

## RJSF Integration

### Custom Widgets

RJSF custom widgets should use the same patterns:

```tsx
// src/lib/rjsf-widgets.tsx

import { WidgetProps } from "@rjsf/utils"
import { inputStyles, labelStyles } from "@/lib/ui-patterns"
import * as Label from "@radix-ui/react-label"

export const TextWidget = (props: WidgetProps) => {
  return (
    <div>
      {props.label && (
        <Label.Root htmlFor={props.id} className={labelStyles}>
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </Label.Root>
      )}
      <input
        id={props.id}
        className={cn(
          inputStyles,
          props.rawErrors && props.rawErrors.length > 0 &&
            "border-destructive focus-visible:ring-destructive"
        )}
        type="text"
        value={props.value || ""}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={() => props.onBlur(props.id, props.value)}
        onFocus={() => props.onFocus(props.id, props.value)}
        disabled={props.disabled || props.readonly}
        placeholder={props.placeholder}
      />
      {props.rawErrors && props.rawErrors.length > 0 && (
        <p className="text-sm text-destructive mt-1">
          {props.rawErrors.join(", ")}
        </p>
      )}
      {props.schema.description && (
        <p className="text-sm text-muted-foreground mt-1">
          {props.schema.description}
        </p>
      )}
    </div>
  )
}

export const SelectWidget = (props: WidgetProps) => {
  // Use Radix Select with proper styling
  // ...
}

// Export all widgets
export const customWidgets = {
  TextWidget,
  SelectWidget,
  // ... other widgets
}
```

### Custom Fields

```tsx
// src/lib/rjsf-fields.tsx

import { FieldProps } from "@rjsf/utils"
import { inputStyles } from "@/lib/ui-patterns"

export const CustomTextField = (props: FieldProps) => {
  // Custom field implementation using ui-patterns
  // ...
}

export const customFields = {
  customText: CustomTextField,
  // ... other fields
}
```

### Using RJSF in Forms

```tsx
import Form from "@rjsf/core"
import { customWidgets } from "@/lib/rjsf-widgets"
import { customFields } from "@/lib/rjsf-fields"

<Form
  schema={jsonSchema}
  uiSchema={uiSchema}
  widgets={customWidgets}
  fields={customFields}
  onSubmit={onSubmit}
/>
```

---

## When to Create Components

### ✅ CREATE a component when:

1. **Domain-specific business logic**
   ```tsx
   // ✅ Good: Environment-specific component
   export function EnvironmentVariableTable({ variables, onUpdate }) {
     // Complex domain logic for managing environment variables
   }
   ```

2. **Complex state management**
   ```tsx
   // ✅ Good: Stateful component with business logic
   export function TeamSelectorChip({ team, onTeamChange }) {
     const [isEditing, setIsEditing] = useState(false)
     const { teams, loading } = useTeams()
     // Complex interaction logic
   }
   ```

3. **Repeated domain patterns**
   ```tsx
   // ✅ Good: Domain-specific reusable component
   export function PermissionScopeRow({ scope, onToggle }) {
     // Specific to permission management domain
   }
   ```

4. **Integration with external systems**
   ```tsx
   // ✅ Good: Integrates with specific API
   export function FrameworkPresetSelector({ onSelect }) {
     const { frameworks } = useFrameworkAPI()
     // API-specific logic
   }
   ```

### ❌ DO NOT create a component when:

1. **Simple styling only**
   ```tsx
   // ❌ Bad: Just a styled div
   export function Card({ children }) {
     return <div className="rounded-lg border p-4">{children}</div>
   }

   // ✅ Good: Use pattern directly
   import { cardStyles } from "@/lib/ui-patterns"
   <div className={cardStyles}>{children}</div>
   ```

2. **Thin wrapper around existing component**
   ```tsx
   // ❌ Bad: Unnecessary wrapper
   export function Button({ children, ...props }) {
     return <button className="..." {...props}>{children}</button>
   }

   // ✅ Good: Use pattern directly
   import { buttonVariants } from "@/lib/ui-patterns"
   <button className={cn(buttonVariants())}>{children}</button>
   ```

3. **Just passing through props**
   ```tsx
   // ❌ Bad: No added value
   export function Input(props) {
     return <input {...props} />
   }

   // ✅ Good: Use native element with pattern
   import { inputStyles } from "@/lib/ui-patterns"
   <input className={inputStyles} {...props} />
   ```

---

## Migration Reference

### Quick Reference Table

| Old Component | New Approach | Pattern Location |
|--------------|--------------|------------------|
| `<Button>` | `<button className={cn(buttonVariants())}>` | `@/lib/ui-patterns` |
| `<Input>` | `<input className={inputStyles}>` | `@/lib/ui-patterns` |
| `<Label>` | `<LabelPrimitive.Root className={labelStyles}>` | `@/lib/ui-patterns` + `@radix-ui/react-label` |
| `<Card>` | `<div className={cardStyles}>` | `@/lib/ui-patterns` |
| `<Badge>` | `<span className={cn(badgeVariants())}>` | `@/lib/ui-patterns` |
| `<Select>` | `<SelectPrimitive.Root>` | `@radix-ui/react-select` + styles |
| `<Dialog>` | `<DialogPrimitive.Root>` | `@radix-ui/react-dialog` + styles |
| `<Checkbox>` | `<CheckboxPrimitive.Root>` | `@radix-ui/react-checkbox` + styles |
| `<Switch>` | `<SwitchPrimitive.Root>` | `@radix-ui/react-switch` + styles |
| `<Tabs>` | `<TabsPrimitive.Root>` | `@radix-ui/react-tabs` + styles |

### Import Map

```tsx
// Old imports (DELETED)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

// New imports
import { buttonVariants, inputStyles, labelStyles, cardStyles, cardHeaderStyles, cardTitleStyles } from "@/lib/ui-patterns"
import * as Label from "@radix-ui/react-label"
import { cn } from "@/lib/utils"
```

---

## Troubleshooting

### Issue: "I need a component with variants"

**Solution**: Use CVA in ui-patterns.ts

```tsx
// @/lib/ui-patterns.ts
export const myComponentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "...",
        special: "...",
      },
      size: {
        sm: "...",
        lg: "...",
      },
    },
  }
)

// Usage
<div className={cn(myComponentVariants({ variant: "special", size: "lg" }))}>
  ...
</div>
```

### Issue: "Styles are getting duplicated"

**Solution**: Extract to ui-patterns.ts

```tsx
// ❌ Bad: Duplicating styles
// file1.tsx
<input className="flex h-9 w-full rounded-md border..." />

// file2.tsx
<input className="flex h-9 w-full rounded-md border..." />

// ✅ Good: Shared pattern
// @/lib/ui-patterns.ts
export const inputStyles = "flex h-9 w-full rounded-md border..."

// file1.tsx
import { inputStyles } from "@/lib/ui-patterns"
<input className={inputStyles} />

// file2.tsx
import { inputStyles } from "@/lib/ui-patterns"
<input className={inputStyles} />
```

### Issue: "I need to customize a pattern"

**Solution**: Use cn() to merge classes

```tsx
import { inputStyles } from "@/lib/ui-patterns"

// Extend with additional classes
<input className={cn(inputStyles, "mt-4 bg-red-50")} />

// Conditionally add classes
<input className={cn(
  inputStyles,
  hasError && "border-destructive",
  isLarge && "h-12"
)} />
```

### Issue: "TypeScript errors after migration"

**Solution**: Check prop types

```tsx
// If you had custom props before
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive"
}

// Now use VariantProps from CVA
import { type VariantProps } from "class-variance-authority"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>
```

### Issue: "RJSF form not working after migration"

**Solution**: Check widget/field implementation

1. Verify all props passed correctly
2. Check className merging with errors
3. Ensure value/onChange/onBlur work
4. Test with validation errors
5. Check if schema.description displayed

```tsx
// Checklist for RJSF widgets:
- [ ] id prop set correctly
- [ ] value prop works
- [ ] onChange calls props.onChange
- [ ] onBlur calls props.onBlur
- [ ] disabled/readonly respected
- [ ] rawErrors displayed
- [ ] schema.description shown
- [ ] required indicator shown
- [ ] placeholder works
```

---

## FAQ

### Q: Should I ever create a wrapper component?

**A**: Only if it contains domain-specific business logic, complex state management, or integrates with external systems. Never for simple styling.

### Q: What about TypeScript autocompletion?

**A**: You'll lose some autocompletion vs wrapper components, but gain explicit visibility of what's happening. Use TypeScript's IntelliSense for HTML attributes and CVA's `VariantProps` for variant types.

### Q: This seems more verbose?

**A**: Yes, slightly. But it's explicit, easier to debug, and results in smaller bundles. The trade-off is worth it for maintainability.

### Q: Can I still use shadcn/ui?

**A**: Yes! You can still generate shadcn components temporarily for reference, extract the patterns to ui-patterns.ts, then delete the component file. Don't commit the wrapper component.

### Q: What if I need the same component in many places?

**A**: Extract the pattern to ui-patterns.ts. If it has business logic, create a domain component. If it's just styling, use the pattern directly.

---

## Summary

### Do This ✅

- Use direct DOM elements (`<button>`, `<input>`, `<div>`, etc.)
- Use Radix primitives for complex interactions
- Extract styles to `@/lib/ui-patterns.ts`
- Use CVA for variants
- Use `cn()` to merge classes
- Create components for domain logic

### Don't Do This ❌

- Don't create wrapper components for simple styling
- Don't duplicate styles across files
- Don't abstract too early
- Don't create components just to reduce verbosity

### When in Doubt

Ask yourself:
1. Does this have domain-specific business logic? → **Create component**
2. Is this just styling/variants? → **Use pattern from ui-patterns.ts**
3. Is this a complex Radix primitive? → **Use Radix directly with styles**
4. Is this simple HTML? → **Use direct DOM element with Tailwind**

---

**Last Updated**: 2025-10-23
**Version**: 1.0
**Maintained By**: Engineering Team

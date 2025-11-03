# Leger Schema-to-Form Pipeline

## Overview

The Leger web application uses a **dynamic form generation system** powered by React JSON Schema Form (RJSF) that automatically generates complex, multi-section data entry forms from JSON Schema definitions. This enables the release configuration interface to stay in sync with the schema evolution without manual form coding.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Build Time (GitHub Actions / npm run build)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Pull git submodules                                         │
│     ├─ schemas/releases/latest/schema.json                      │
│     └─ model-store/{cloud,local}/*.json                         │
│                                                                 │
│  2. Run generation scripts                                      │
│     ├─ generate-ui-schema.js    → src/generated/uiSchema.json  │
│     ├─ generate-model-options.js → src/generated/model-opts.json│
│     └─ generate-types.js        → src/generated/types.ts       │
│                                                                 │
│  3. Build application with generated files                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Runtime (Browser)                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ReleaseFormPage                                                │
│  └─ ReleaseConfigForm (RJSF)                                    │
│      ├─ schema.json (validation rules)                          │
│      ├─ uiSchema.json (progressive disclosure)                  │
│      ├─ Custom Widgets (leverage existing components)           │
│      └─ Custom Templates (CategorySection layout)               │
│                                                                 │
│  User fills form → validates → generates user-config.json       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. JSON Schema with Extensions

The `schema.json` uses standard JSON Schema with custom `x-*` extensions:

```json
{
  "features": {
    "type": "object",
    "properties": {
      "rag": {
        "type": "boolean",
        "title": "RAG (Retrieval-Augmented Generation)",
        "default": false,
        "x-category": "Features",
        "x-display-order": 100,
        "x-rationale": "Enable semantic search over documents"
      }
    }
  },
  "providers": {
    "type": "object",
    "properties": {
      "vector_db": {
        "type": "string",
        "enum": ["pgvector", "qdrant", "chroma"],
        "x-depends-on": {
          "features.rag": true
        },
        "x-provider-fields": {
          "qdrant": ["qdrant_url", "qdrant_api_key"]
        }
      }
    }
  }
}
```

**Supported Extensions:**

- `x-category`: Group fields into sections (e.g., "Features", "Infrastructure")
- `x-display-order`: Control field ordering within sections
- `x-depends-on`: Define conditional visibility (progressive disclosure)
- `x-provider-fields`: Map provider choices to required config fields
- `x-affects-services`: Define which services are deployed based on choices
- `x-sensitive`: Mark fields as secrets (use password input)
- `x-readonly`: Make fields read-only
- `x-help`: Additional help text for users

### 2. Progressive Disclosure

Fields automatically show/hide based on dependencies:

```typescript
// Example: vector_db field only visible when features.rag = true
{
  "x-depends-on": {
    "features.rag": true
  }
}
```

**Implementation:**
- `generate-ui-schema.js` extracts dependencies into `ui:dependencies`
- `ReleaseConfigForm` evaluates dependencies against current form data
- Hidden fields get `ui:widget: 'hidden'` applied dynamically

### 3. Custom Widgets

Map RJSF widgets to existing Leger components:

| RJSF Widget | Leger Component | Usage |
|-------------|----------------|--------|
| `TextWidget` | `TextField` | Text inputs with validation |
| `SelectWidget` | `SelectField` | Dropdowns (enums) |
| `CheckboxWidget` | `ToggleField` | Boolean toggles |
| `TextareaWidget` | `Textarea` | Long text fields |
| `NumberWidget` | `Input[type=number]` | Numeric inputs |
| `URLWidget` | `URLInput` | URL validation |

### 4. Model Integration

The `model-store` submodule provides:

**Cloud Models** (`model-store/cloud/*.json`):
```json
{
  "id": "claude-sonnet-4-5",
  "name": "Claude Sonnet 4.5",
  "provider": "anthropic",
  "litellm_model_name": "anthropic/claude-sonnet-4-5-20250929",
  "context_window": 200000,
  "capabilities": ["chat", "reasoning", "code", "tool_calling", "vision"],
  "enabled": true
}
```

**Local Models** (`model-store/local/*.json`):
```json
{
  "id": "qwen3-0.6b",
  "name": "Qwen3 0.6B",
  "model_uri": "huggingface://Qwen/Qwen3-0.6B-GGUF/...",
  "group": "task",
  "capabilities": ["chat"],
  "enabled": true
}
```

**Generated Output** (`src/generated/model-options.json`):
```json
{
  "all": [/* all enabled models */],
  "cloud": [/* cloud models only */],
  "local": [/* local models only */],
  "byGroup": {
    "task": [/* task models */],
    "embeddings": [/* embedding models */]
  },
  "byProvider": {
    "anthropic": [/* Anthropic models */],
    "openai": [/* OpenAI models */]
  }
}
```

## Generation Scripts

### `generate-ui-schema.js`

**Input:** `schemas/releases/latest/schema.json`
**Output:** `src/generated/uiSchema.json`

**Process:**
1. Parse schema.json
2. Extract `x-*` extensions
3. Convert to RJSF uiSchema format
4. Map widgets based on field types
5. Process conditional logic from `x-depends-on`
6. Apply display ordering from `x-display-order`

### `generate-model-options.js`

**Input:** `model-store/cloud/*.json`, `model-store/local/*.json`
**Output:** `src/generated/model-options.json`

**Process:**
1. Load all model definitions
2. Filter by `enabled: true`
3. Group by provider, group, and type
4. Convert to RJSF enum options format
5. Include metadata (capabilities, context window)

### `generate-types.js`

**Input:** `schemas/releases/latest/schema.json`
**Output:** `src/generated/release-config.types.ts`

**Process:**
1. Parse JSON Schema
2. Convert to TypeScript interfaces
3. Generate nested types for objects
4. Include JSDoc comments from descriptions
5. Handle enums, unions, and optional fields

### `generate-all.js`

Master script that runs all generation scripts in sequence with prerequisite checking.

## npm Scripts

```json
{
  "scripts": {
    "schema:init": "git submodule update --init --recursive",
    "schema:update": "git submodule update --remote --merge",
    "schema:generate": "node scripts/schema-gen/generate-all.js",
    "schema:ui": "node scripts/schema-gen/generate-ui-schema.js",
    "schema:models": "node scripts/schema-gen/generate-model-options.js",
    "schema:types": "node scripts/schema-gen/generate-types.js",
    "postinstall": "npm run schema:init",
    "build": "npm run schema:generate && vite build && npm run build:worker"
  }
}
```

## Development Workflow

### Initial Setup

```bash
# Clone repo
git clone https://github.com/leger-labs/app.leger.run
cd app.leger.run

# Install dependencies (auto-runs postinstall → schema:init)
npm install

# Generate schema files
npm run schema:generate

# Start dev server
npm run dev
```

### Updating Schema

When the schema repo is updated:

```bash
# Pull latest schema
npm run schema:update

# Regenerate all files
npm run schema:generate

# Rebuild app
npm run build
```

### Adding a New Field

1. **Update schema repo** (`leger-labs/schema`):
   ```json
   {
     "new_field": {
       "type": "string",
       "title": "New Field",
       "description": "Description of new field",
       "x-category": "Features",
       "x-display-order": 200
     }
   }
   ```

2. **Update submodule in app.leger.run**:
   ```bash
   npm run schema:update
   ```

3. **Regenerate**:
   ```bash
   npm run schema:generate
   ```

4. **Form automatically includes new field** - no manual coding needed!

### Adding a New Model

1. **Add to model-store** (`leger-labs/model-store`):
   ```json
   {
     "id": "new-model",
     "name": "New Model",
     "provider": "openai",
     "litellm_model_name": "openai/new-model",
     "enabled": true
   }
   ```

2. **Update and regenerate**:
   ```bash
   npm run schema:update
   npm run schema:models
   ```

3. **Model appears in dropdowns automatically**!

## Component Structure

### ReleaseFormPage

Main page component that:
- Loads schema and uiSchema
- Manages form state
- Handles save/submit
- Provides navigation and breadcrumbs

### ReleaseConfigForm

RJSF wrapper that:
- Applies progressive disclosure logic
- Connects custom widgets and templates
- Handles validation with AJV
- Manages form data state

### Custom Widgets

Located in `src/components/rjsf/widgets/`:
- Adapt RJSF widget API to Leger components
- Pass through validation errors
- Handle state changes
- Apply styling

### Custom Templates

Located in `src/components/rjsf/templates/`:
- `FieldTemplate`: Individual field wrapper
- `ObjectFieldTemplate`: Nested section layout with CategorySection
- `ArrayFieldTemplate`: Array field handling with add/remove

## Progressive Disclosure Implementation

### At Build Time

`generate-ui-schema.js` extracts dependencies:

```javascript
function processDependencies(schema) {
  if (!schema['x-depends-on']) return undefined;

  const deps = schema['x-depends-on'];
  const conditions = [];

  for (const [path, value] of Object.entries(deps)) {
    conditions.push({
      path: path.split('.'),
      value: value
    });
  }

  return conditions;
}
```

### At Runtime

`ReleaseConfigForm` evaluates dependencies:

```typescript
function checkDependencies(
  dependencies: Array<{ path: string[]; value: any }>,
  formData: any
): boolean {
  return dependencies.every((dep) => {
    let current = formData;
    for (const key of dep.path) {
      if (current === undefined) return false;
      current = current[key];
    }
    return current === dep.value;
  });
}

function applyProgressiveDisclosure(uiSchema, formData) {
  // Hide fields whose dependencies aren't met
  Object.entries(uiSchema).forEach(([key, value]) => {
    const deps = value['ui:dependencies'];
    if (deps && !checkDependencies(deps, formData)) {
      uiSchema[key]['ui:widget'] = 'hidden';
    }
  });
  return uiSchema;
}
```

## Validation

Validation happens at two levels:

### 1. JSON Schema Validation (AJV)

RJSF uses AJV validator with the schema:
- Type checking (string, number, boolean, etc.)
- Required fields
- Pattern matching (regex)
- Min/max values
- Enum constraints

### 2. Custom Validation

Can be added via `customValidate` prop:

```typescript
function customValidate(formData, errors) {
  // Custom cross-field validation
  if (formData.features.rag && !formData.providers.vector_db) {
    errors.providers.vector_db.addError(
      'Vector DB required when RAG is enabled'
    );
  }
  return errors;
}
```

## Output Format

The form generates a `user-config.json` matching the schema structure:

```json
{
  "tailscale": {
    "full_hostname": "blueprint.tail8dd1.ts.net",
    "hostname": "blueprint",
    "tailnet": "tail8dd1.ts.net"
  },
  "infrastructure": {
    "network": {
      "name": "llm",
      "subnet": "10.89.0.0/24"
    },
    "services": {
      "caddy": { "port": 443 },
      "openwebui": { "port": 8080 }
    }
  },
  "features": {
    "rag": true,
    "web_search": false,
    "image_generation": false
  },
  "providers": {
    "vector_db": "qdrant",
    "rag_embedding": "openai"
  },
  "provider_config": {
    "qdrant_url": "http://qdrant:6333",
    "qdrant_api_key": "{QDRANT_API_KEY}"
  },
  "secrets": {
    "openai_api_key": "{OPENAI_API_KEY}"
  }
}
```

**Note:** Secrets are placeholders only - actual values managed separately.

## Troubleshooting

### Schema generation fails

```bash
# Check submodules are initialized
git submodule status

# Update submodules
npm run schema:init

# Try generating again
npm run schema:generate
```

### Form fields not showing

1. Check dependencies in formData
2. Verify x-depends-on conditions are met
3. Check browser console for errors
4. Verify uiSchema.json was generated

### Type errors

```bash
# Regenerate types
npm run schema:types

# Check TypeScript
npm run typecheck
```

## Future Enhancements

- [ ] Add field-level validation messages
- [ ] Implement auto-save to localStorage
- [ ] Add form completion percentage indicator
- [ ] Implement section-level save buttons
- [ ] Add undo/redo functionality
- [ ] Implement form diff viewer (compare releases)
- [ ] Add import/export functionality
- [ ] Implement form templates/presets

## References

- [RJSF Documentation](https://rjsf-team.github.io/react-jsonschema-form/)
- [JSON Schema Specification](https://json-schema.org/)
- [AJV Validator](https://ajv.js.org/)
- [Leger Schema Repository](https://github.com/leger-labs/schema)
- [Leger Model Store](https://github.com/leger-labs/model-store)

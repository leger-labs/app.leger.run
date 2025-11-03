# Generated Files

This directory contains auto-generated files from the schema generation pipeline.

## Files Generated

- `uiSchema.json` - RJSF UI Schema with progressive disclosure rules
- `model-options.json` - Model dropdown options from model-store
- `release-config.types.ts` - TypeScript types for release configuration

## Generation

These files are generated during the build process by running:

```bash
npm run schema:generate
```

Or individually:

```bash
npm run schema:ui      # Generate uiSchema
npm run schema:models  # Generate model options
npm run schema:types   # Generate TypeScript types
```

## Source

Generated from:
- `schemas/releases/latest/schema.json`
- `model-store/cloud/*.json`
- `model-store/local/*.json`

**DO NOT EDIT** - These files are overwritten during builds.

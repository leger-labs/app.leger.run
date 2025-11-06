# Monorepo Consolidation (November 2025)

The `leger-labs` webapp has been successfully consolidated into a single repository.  
This replaces the previous setup where **three independent GitHub submodules** —  
`marketplace`, `model-store`, and `schemas` — were pulled during the Cloudflare Workers build.

## Overview

All core data and schema sources are now co-located within the main webapp repo:
```

src/
├─ assets/
│   └─ icons/               ← collected SVG icons and registry
├─ data/
│   ├─ marketplace/         ← from leger-labs/marketplace
│   ├─ models/              ← from leger-labs/model-store
│   └─ core/                ← from leger-labs/schemas
└─ types/
├─ core.ts
├─ models.ts
├─ icons.ts
└─ marketplace.ts

```

## What Was Done

- **Removed submodules**  
  The legacy submodules for `marketplace`, `model-store`, and `schemas` were removed from  
  `.gitmodules` and `.gitignore`. Only the `brand` submodule remains (for fonts).

- **Migrated Data and Schemas**
  - Marketplace JSON files moved to `src/data/marketplace/`
  - Model-store JSON files (`cloud`, `local`, `makers`, `providers`) moved to `src/data/models/`
  - Schema and release-catalog JSONs moved to `src/data/core/`  
    → schema versioning was deprecated in favor of a rolling release model,  
       with the release catalog used for reproducible builds.

- **Icons**
  - All service/provider/model SVGs collected under `src/assets/icons/`
  - Added a simple `index.ts` for the icon registry

- **Type Definitions**
  - Added `src/types/core.ts`, `src/types/models.ts`, and `src/types/icons.ts`
  - Updated `src/types/marketplace.ts`

- **Build and Runtime Adjustments**
  - Updated Vite loaders (`src/data/models/index.ts`, `src/data/marketplace/index.ts`)
  - Removed submodule copy scripts from `package.json`
  - Simplified the build pipeline — the repo now builds cleanly without fetching external data

## Status

✅ Consolidation complete  
✅ Successful `npm run build`  
✅ All imports valid  
✅ PR created:  
[**Consolidate monorepo migration**](https://github.com/leger-labs/app.leger.run/pull/new/claude/consolidate-monorepo-migration-011CUrMChhkCdTg5qQHU352E)

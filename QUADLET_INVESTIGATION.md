# Quadlet Configuration Mechanism Investigation

**Date:** 2025-11-14
**Branch:** `claude/investigate-quadlet-config-013QpSazyeBxXXQR9feZRbAP`
**Objective:** Prepare a full investigation into the current quadlet configuration mechanism and design a high-quality full default implementation for novice users.

---

## Executive Summary

The current quadlet configuration system is **partially complete** but **requires significant enhancement** to achieve the goal of a "zero-configuration" experience for novice users. The system has strong foundational architecture but lacks comprehensive default values and intelligent inference logic.

### Key Findings

1. **Current State**: Programmatic quadlet generation with basic service templates
2. **Gap**: Minimal default configuration - users must configure almost everything
3. **Reference**: Previous chezmoi-based system had comprehensive defaults and provider-based inference
4. **Goal**: Novice users should deploy without setting a single environment variable

---

## Current Architecture

### 1. Configuration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Configuration Sources                        │
├─────────────────────────────────────────────────────────────────────┤
│ 1. ReleaseConfig (D1)      - User's composition choices             │
│ 2. Settings (KV)           - Tailscale configuration (one-time)     │
│ 3. Marketplace (Future)    - Service configurations                 │
│ 4. Secrets (KV)            - API keys                               │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│              Config Generator (config-generator.ts)                 │
│                                                                     │
│  Combines sources → UserConfig (user-config.json format)           │
│  • buildInfrastructureServices()                                   │
│  • buildFeatures()                                                 │
│  • buildProviders()                                                │
│  • buildProviderConfig()                                           │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│            Template Renderer (template-renderer.ts)                 │
│                                                                     │
│  UserConfig → Quadlet Files (.container, .volume, .network, .env)  │
│  • renderTemplates()                                               │
│  • generateContainerQuadlet() - Programmatic generation            │
│  • generateNetworkQuadlet()                                        │
│  • generateVolumeQuadlet()                                         │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   R2 Storage (r2-storage.ts)                        │
│                                                                     │
│  Quadlet Files → Cloudflare R2 → CLI Downloads                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Key Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `api/services/config-generator.ts` | Combines sources → UserConfig | 507 | ⚠️ Basic |
| `api/services/template-renderer.ts` | UserConfig → Quadlet files | 798 | ⚠️ Programmatic |
| `api/services/deployment-orchestrator.ts` | Coordinates deployment flow | - | ✅ Good |
| `api/services/r2-storage.ts` | Uploads to R2, generates CLI manifest | - | ✅ Good |
| `api/templates/services/openwebui/openwebui.env.njk` | OpenWebUI environment template | 547 | ✅ Comprehensive |
| `api/models/release-config.ts` | ReleaseConfig type definitions | 129 | ✅ Good |
| `api/models/configuration.ts` | UserConfig type definitions | 137 | ✅ Good |

### 3. Current Service Coverage

**Core Services (Always Deployed):**
- ✅ Caddy (reverse proxy)
- ✅ Cockpit (system management)
- ✅ OpenWebUI (chat interface)
- ✅ OpenWebUI Postgres + Redis
- ✅ LiteLLM (unified LLM proxy)
- ✅ LiteLLM Postgres + Redis
- ✅ llama-swap (local model router)

**Marketplace Services (Optional):**
- ✅ Qdrant (vector database)
- ✅ SearXNG (+ redis)
- ✅ ComfyUI (image generation)
- ✅ Whisper (speech-to-text)
- ✅ EdgeTTS (text-to-speech)
- ✅ Jupyter (code execution)
- ✅ Tika (content extraction)

---

## Comparison: Current vs Reference (Chezmoi)

### Architecture Differences

| Aspect | Current (Web App) | Reference (Chezmoi) |
|--------|-------------------|---------------------|
| **Template Engine** | Programmatic (TypeScript) | Nunjucks templates (.njk) |
| **Configuration Format** | JSON (UserConfig) | YAML (.chezmoi.yaml) |
| **Secret Management** | Podman secrets | age encryption |
| **Default Strategy** | Minimal defaults | Comprehensive defaults |
| **Provider Inference** | Basic | Advanced (enabled_by rules) |
| **Service Registry** | Hardcoded in template-renderer.ts | Declarative in chezmoi config |

### Feature Comparison

| Feature | Current | Reference | Gap |
|---------|---------|-----------|-----|
| **Default Models** | ❌ None | ✅ Full GPT-5, Claude 4.5, Gemini 2.5, local models | **CRITICAL** |
| **Default Providers** | ❌ None | ✅ OpenAI, Anthropic, Gemini, local embedding | **CRITICAL** |
| **Infrastructure Defaults** | ✅ Network (llm, 10.89.0.0/24) | ✅ Same | ✅ Good |
| **Service Defaults** | ⚠️ Partial (images, ports) | ✅ Complete (all env vars) | **HIGH** |
| **Provider Config Defaults** | ❌ Minimal | ✅ Comprehensive (all providers) | **HIGH** |
| **Task Model Defaults** | ❌ None | ✅ qwen3-0.6b, qwen3-4b | **MEDIUM** |
| **Feature Inference** | ⚠️ Basic | ✅ Advanced (enabled_by) | **MEDIUM** |
| **Secret Defaults** | ❌ None | ✅ Default local keys | **LOW** |

---

## Critical Gaps for Novice Users

### 1. **No Default Models** ❌ CRITICAL

**Current State:**
```typescript
// User MUST select models or nothing works
model_assignments: {
  primary_chat_models: [],  // ❌ EMPTY
  embedding_models: []       // ❌ EMPTY
}
```

**Required:**
```typescript
// Should work out-of-the-box with local models
model_assignments: {
  primary_chat_models: [
    "openai/gpt-oss-20b",     // Fast local model (via llama-swap)
    "openai/gpt-oss-120b"     // Powerful local model
  ],
  embedding_models: [
    "qwen3-embedding-8b"      // Default embedding model
  ]
}
```

### 2. **No Default Providers** ❌ CRITICAL

**Current State:**
```typescript
// User MUST configure everything
providers: {
  vector_db: undefined,           // ❌ RAG won't work
  rag_embedding: undefined,       // ❌ RAG won't work
  web_search_engine: undefined,   // ❌ Search won't work
  // etc...
}
```

**Required:**
```typescript
// Intelligent defaults for minimal config
providers: {
  vector_db: "pgvector",          // ✅ Uses existing postgres
  rag_embedding: "openai",        // ✅ Points to local embedding
  web_search_engine: "searxng",   // ✅ Deploy searxng by default
  stt_engine: "whisper",          // ✅ Deploy whisper by default
  tts_engine: "edgetts",          // ✅ Deploy edgetts by default
  code_execution_engine: "jupyter" // ✅ Deploy jupyter by default
}
```

### 3. **Minimal Service Configurations** ⚠️ HIGH

**Current State:**
- Services have hardcoded images/ports in `SERVICE_IMAGES` map
- Environment variables are partially set
- No default values for service-specific configs

**Required:**
- All environment variables with intelligent defaults
- Complete service metadata (timeouts, health checks, resources)
- Provider-specific configurations pre-populated

### 4. **No Feature Inference** ⚠️ MEDIUM

**Current State:**
```typescript
// Features are manually enabled/disabled
features: {
  rag_enabled: false,  // User must enable
  // etc...
}
```

**Reference (Chezmoi):**
```yaml
# Features automatically enabled based on providers
searxng:
  enabled_by: ["openwebui.providers.web_search_engine == 'searxng'"]
```

**Required:**
- Automatic service deployment based on provider selections
- Automatic dependency resolution
- Automatic feature enablement

---

## Reference Configuration Analysis

### Chezmoi Configuration Structure

The reference config shows a **5-layer architecture**:

```yaml
# ═════════════════════════════════════════════════════════════════════
# LAYER 1: USER INFORMATION (one-time setup)
# ═════════════════════════════════════════════════════════════════════
user:
  name: "mecattaf"
  email: "thomas@mecattaf.dev"

# ═════════════════════════════════════════════════════════════════════
# LAYER 2: INFRASTRUCTURE SERVICES REGISTRY (comprehensive)
# ═════════════════════════════════════════════════════════════════════
infrastructure:
  network:
    name: "llm"
    subnet: "10.89.0.0/24"

  services:
    litellm:
      hostname: "litellm"
      port: 4000
      published_port: 4000
      external_subdomain: "llm"
      requires: ["litellm_postgres", "litellm_redis"]
      enabled: true

    searxng:
      enabled_by: ["openwebui.providers.web_search_engine == 'searxng'"]
      # ... config

# ═════════════════════════════════════════════════════════════════════
# LAYER 3: SECRETS (age-encrypted)
# ═════════════════════════════════════════════════════════════════════
secrets:
  api_keys:
    litellm_master: "sk-litellm-local"

  llm_providers:
    openai: "{{ .secrets.llm_providers.openai }}"
    anthropic: "{{ .secrets.llm_providers.anthropic }}"

# ═════════════════════════════════════════════════════════════════════
# LAYER 4: SERVICE CONFIGURATIONS (LiteLLM, OpenWebUI, etc.)
# ═════════════════════════════════════════════════════════════════════
litellm:
  database_url: "postgresql://..."
  models:
    - name: "gpt-5"
      provider: "openai"
      enabled: true

openwebui:
  # 🎯 LAYER 1: Feature Flags
  features:
    rag: true
    web_search: true

  # 🔌 LAYER 2: Provider Selections
  providers:
    vector_db: "pgvector"
    web_search_engine: "searxng"

  # ⚙️ LAYER 3: Provider Configurations
  vector_db_config:
    pgvector:
      db_url: "postgresql://..."

# ═════════════════════════════════════════════════════════════════════
# LAYER 5: LOCAL INFERENCE (ramalama + llama-swap)
# ═════════════════════════════════════════════════════════════════════
local_inference:
  models:
    gpt_oss_20b:
      model_uri: "huggingface://openai/gpt-oss-20b-GGUF/..."
      enabled: true
```

### Key Insights from Reference

1. **Comprehensive Defaults**:
   - Every service has full configuration
   - All environment variables defined
   - Sensible defaults for novice users

2. **Conditional Enablement** (`enabled_by`):
   ```yaml
   searxng:
     enabled_by: ["openwebui.providers.web_search_engine == 'searxng'"]
   ```
   - Services auto-deploy based on provider selections
   - Dependencies auto-resolved

3. **Provider-Based Architecture**:
   - Features → Providers → Provider Configs
   - Clear separation of concerns
   - Easy to understand and extend

4. **Complete Model Catalog**:
   - Latest GPT-5 family (including gpt-5-nano, gpt-5-mini)
   - Claude Sonnet 4.5, Opus 4.1
   - Gemini 2.5 Flash, 2.5 Pro
   - Local models (GPT-OSS 20B, 120B)
   - Embedding models (qwen3-embedding-8b)

---

## Proposed Solution: Full Default Implementation

### Phase 1: Default Model Catalog ✅

**Create:** `api/config/default-models.ts`

```typescript
export const DEFAULT_MODELS = {
  // Local models (always available, no API keys needed)
  local: {
    chat: [
      "gpt-oss-20b",      // Fast, general purpose
      "gpt-oss-120b"      // Powerful, complex tasks
    ],
    embedding: [
      "qwen3-embedding-8b" // Default embedding
    ]
  },

  // Cloud models (require API keys, disabled by default)
  cloud: {
    openai: [
      "openai/gpt-5",
      "openai/gpt-5-mini",
      "openai/gpt-5-nano"
    ],
    anthropic: [
      "anthropic/claude-sonnet-4-5",
      "anthropic/claude-opus-4-1"
    ],
    gemini: [
      "gemini/gemini-2.5-flash",
      "gemini/gemini-2.5-pro"
    ]
  }
}
```

### Phase 2: Default Provider Configuration ✅

**Create:** `api/config/default-providers.ts`

```typescript
export const DEFAULT_PROVIDERS = {
  // Vector database (use pgvector - already have postgres)
  vector_db: "pgvector",

  // Embedding (use openai-compatible → llama-swap)
  rag_embedding: "openai",

  // Content extraction (deploy tika by default)
  content_extraction: "tika",

  // Web search (deploy searxng by default)
  web_search_engine: "searxng",
  web_loader: "requests",

  // Audio (deploy whisper + edgetts by default)
  stt_engine: "whisper",
  tts_engine: "edgetts",

  // Code execution (deploy jupyter by default)
  code_execution_engine: "jupyter",

  // Image generation (disabled by default - resource intensive)
  image_engine: null,

  // Storage (local by default)
  storage_provider: "local"
}
```

### Phase 3: Default Provider Configs ✅

**Create:** `api/config/default-provider-configs.ts`

```typescript
export const DEFAULT_PROVIDER_CONFIGS = {
  // OpenWebUI settings
  webui_name: "Leger AI",
  custom_name: "Blueprint LLM Stack",
  default_locale: "en-US",
  log_level: "INFO",

  // RAG settings
  rag_top_k: 5,
  chunk_size: 1500,
  chunk_overlap: 100,
  pdf_extract_images: true,

  // Task models (local, fast)
  task_model_title: "qwen3-0.6b",
  task_model_tags: "qwen3-4b",
  task_model_autocomplete: "qwen3-0.6b",
  task_model_query: "qwen3-4b",
  task_model_search_query: "qwen3-4b",
  task_model_rag_template: "qwen3-4b",

  // Embedding model
  rag_embedding_model: "qwen3-embedding-8b",

  // Audio settings
  audio_stt_model: "whisper-1",
  audio_tts_model: "tts-1",
  audio_tts_voice: "alloy",

  // Redis
  redis_key_prefix: "open-webui",

  // Timeouts
  openwebui_timeout_start: 900,

  // Provider-specific configs
  qdrant_grpc_port: 6334,
  qdrant_prefer_grpc: false,
  qdrant_on_disk: true,

  chroma_tenant: "default_tenant",
  chroma_database: "default_database",

  // Security
  rag_embedding_trust_remote_code: false,
  rag_reranking_trust_remote_code: false,
  rag_embedding_auto_update: false,
  rag_reranking_auto_update: false
}
```

### Phase 4: Enhanced Config Generator ✅

**Update:** `api/services/config-generator.ts`

```typescript
import { DEFAULT_MODELS } from '../config/default-models'
import { DEFAULT_PROVIDERS } from '../config/default-providers'
import { DEFAULT_PROVIDER_CONFIGS } from '../config/default-provider-configs'

function buildProviders(releaseConfig: ReleaseConfig): Record<string, string> {
  // Start with defaults
  const providers = { ...DEFAULT_PROVIDERS }

  // Override with user selections
  const selections = releaseConfig.service_selections

  if (selections.rag_provider) {
    providers.vector_db = selections.rag_provider
  }

  // ... etc

  return providers
}

function buildProviderConfig(releaseConfig: ReleaseConfig): Record<string, any> {
  // Start with defaults
  const providerConfig = { ...DEFAULT_PROVIDER_CONFIGS }

  // Override with user config
  const openwebuiConfig = releaseConfig.core_services.openwebui || {}

  if (openwebuiConfig.webui_name) {
    providerConfig.webui_name = openwebuiConfig.webui_name
  }

  // ... etc

  return providerConfig
}
```

### Phase 5: Service Auto-Deployment ✅

**Update:** `api/services/template-renderer.ts`

```typescript
function determineServicesToDeployexportfunction determineServicesToDeploy(
  userConfig: UserConfig
): Set<string> {
  const services = new Set<string>()

  // Core services (always)
  services.add('caddy')
  services.add('cockpit')
  services.add('openwebui')
  services.add('openwebui-postgres')
  services.add('openwebui-redis')
  services.add('litellm')
  services.add('litellm-postgres')
  services.add('litellm-redis')
  services.add('llama-swap')

  // RAG-dependent services
  if (userConfig.providers.vector_db === 'qdrant') {
    services.add('qdrant')
  }

  // Always deploy tika if RAG enabled
  if (userConfig.providers.vector_db &&
      userConfig.providers.content_extraction === 'tika') {
    services.add('tika')
  }

  // Web search
  if (userConfig.providers.web_search_engine === 'searxng') {
    services.add('searxng')
    services.add('searxng-redis')
  }

  // Audio
  if (userConfig.providers.stt_engine === 'whisper') {
    services.add('whisper')
  }

  if (userConfig.providers.tts_engine === 'edgetts') {
    services.add('edgetts')
  }

  // Code execution
  if (userConfig.providers.code_execution_engine === 'jupyter') {
    services.add('jupyter')
  }

  // Image generation
  if (userConfig.providers.image_engine === 'comfyui') {
    services.add('comfyui')
  }

  return services
}
```

---

## Implementation Plan

### Milestone 1: Default Configuration Foundation

**Files to Create:**
1. ✅ `api/config/default-models.ts` - Default model catalog
2. ✅ `api/config/default-providers.ts` - Default provider selections
3. ✅ `api/config/default-provider-configs.ts` - Default provider configs
4. ✅ `api/config/defaults.ts` - Barrel export

**Files to Update:**
1. ✅ `api/services/config-generator.ts` - Use defaults, allow overrides
2. ✅ `api/services/template-renderer.ts` - Enhanced service auto-deployment

### Milestone 2: Enhanced Service Definitions

**Files to Update:**
1. ⚠️ `api/services/template-renderer.ts` - Expand `SERVICE_IMAGES` with:
   - All environment variables
   - Health checks
   - Resource limits
   - Proper dependencies

### Milestone 3: Validation & Testing

**Files to Create:**
1. ✅ `api/config/minimal-release.json` - Minimal ReleaseConfig for testing
2. ✅ Test deployment with minimal config
3. ✅ Verify all services start correctly

### Milestone 4: Documentation

**Files to Create/Update:**
1. ✅ `docs/DEFAULT_CONFIGURATION.md` - Document all defaults
2. ✅ `docs/CUSTOMIZATION_GUIDE.md` - How to override defaults
3. ✅ `api/templates/services/*/README.md` - Update service docs

---

## Success Criteria

### For Novice Users (Minimal Config)

A novice user should be able to create a Release with:

```json
{
  "release_metadata": {
    "name": "My First Release",
    "version": "1.0.0"
  },
  "core_services": {},
  "caddy_routes": {
    "openwebui_subdomain": "ai",
    "litellm_subdomain": "llm",
    "llama_swap_subdomain": "local"
  },
  "service_selections": {},
  "model_assignments": {
    "primary_chat_models": []
  },
  "infrastructure": {
    "network": {
      "name": "llm",
      "subnet": "10.89.0.0/24"
    }
  }
}
```

**And get:**
- ✅ Working OpenWebUI at `https://ai.tailnet.ts.net`
- ✅ LiteLLM proxy with local models (gpt-oss-20b, gpt-oss-120b)
- ✅ RAG enabled with pgvector + tika
- ✅ Web search with SearXNG
- ✅ Speech-to-text with Whisper
- ✅ Text-to-speech with EdgeTTS
- ✅ Code execution with Jupyter
- ✅ All services healthy and interconnected

### For Advanced Users (Customization)

Advanced users should be able to:
- ✅ Override any default
- ✅ Add cloud models (GPT-5, Claude 4.5, etc.) by providing API keys
- ✅ Switch providers (e.g., pgvector → qdrant)
- ✅ Enable/disable features granularly
- ✅ Customize task models, RAG settings, etc.

---

## Next Steps

1. **Implement Milestone 1** (Default Configuration Foundation)
   - Create default config files
   - Update config-generator.ts
   - Test with minimal ReleaseConfig

2. **Implement Milestone 2** (Enhanced Service Definitions)
   - Expand SERVICE_IMAGES with full configs
   - Add health checks, resources, etc.

3. **Implement Milestone 3** (Validation & Testing)
   - Create test configs
   - Deploy and verify
   - Fix issues

4. **Implement Milestone 4** (Documentation)
   - Document all defaults
   - Write customization guide
   - Update service READMEs

---

## Conclusion

The current quadlet configuration system has **strong architectural foundations** but **lacks the comprehensive defaults** needed for a "zero-configuration" novice user experience.

The proposed solution introduces:
1. **Default model catalog** (local + cloud)
2. **Default provider selections** (intelligent, resource-aware)
3. **Default provider configurations** (all environment variables)
4. **Enhanced service auto-deployment** (dependency resolution)
5. **Comprehensive documentation** (clear customization paths)

This will enable **novice users to deploy a fully functional LLM stack with minimal configuration**, while still allowing **advanced users full customization control**.

**Estimated Implementation Time:** 4-6 hours (all milestones)

---

**Investigation Complete** ✅

# Quadlet Configuration Mechanism Investigation

**Date:** 2025-11-14
**Branch:** `claude/investigate-quadlet-config-013QpSazyeBxXXQR9feZRbAP`
**Objective:** Prepare a full investigation into the current quadlet configuration mechanism and implement infrastructure-level defaults.

---

## Executive Summary

The current quadlet configuration system has strong architectural foundations. This investigation introduces **infrastructure-level defaults** (RAG settings, timeouts, log levels) while preserving the **user-driven model selection** philosophy.

### Key Principles

1. **NO hardcoded models** - Users select models through the WebUI
2. **Infrastructure defaults** - Sensible defaults for RAG settings, timeouts, etc.
3. **UI-level suggestions** - WebUI can pre-populate forms with suggested values
4. **Backend agnostic** - Deployment uses only what user configured

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
│  • buildProviderConfig() - Uses infrastructure defaults            │
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
```

---

## Implementation: Infrastructure Defaults

### What We Provide as Defaults

**✅ Infrastructure Settings:**
- RAG settings (chunk_size: 1500, chunk_overlap: 100, top_k: 5)
- Timeouts (openwebui_timeout_start: 900)
- Log levels (log_level: 'INFO')
- Security settings (trust_remote_code: false)
- Service URLs (auto-generated from infrastructure)
- Branding (webui_name: 'Leger AI')

**❌ NOT Defaults (User Chooses via WebUI):**
- Model selections (chat models, embedding models, task models)
- Provider API choices (which LLM providers to use)
- Feature enablement (user explicitly enables RAG, web search, etc.)

### File Structure

```
api/config/
├── default-provider-configs.ts  # Infrastructure defaults ONLY
└── defaults.ts                  # Barrel export
```

**Key File: `default-provider-configs.ts`**
- Contains ONLY infrastructure settings
- NO model names or selections
- Used to pre-populate forms in WebUI
- Used to fill missing infrastructure values in config-generator

---

## How Users Configure the System

### 1. Through WebUI (Primary Method)

**Model Selection:**
- User browses model catalog
- User selects chat models (e.g., GPT-5, Claude 4.5, local models)
- User selects embedding models (e.g., qwen3-embedding-8b)
- User selects task models (for titles, tags, autocomplete)

**Service/Provider Selection:**
- User selects vector DB (pgvector, qdrant, chroma)
- User selects search engine (searxng, tavily, etc.)
- User selects audio providers (whisper, edgetts, etc.)

**Infrastructure Tuning (Optional):**
- Forms pre-populated with defaults from `default-provider-configs.ts`
- User can override RAG settings, timeouts, log levels, etc.
- If user doesn't change values, defaults are used

### 2. Configuration Storage

User configuration saved to D1 as `ReleaseConfig`:
```json
{
  "model_assignments": {
    "primary_chat_models": ["openai/gpt-5", "local/qwen3-4b"],
    "embedding_models": ["qwen3-embedding-8b"]
  },
  "service_selections": {
    "rag_provider": "qdrant",
    "web_search_provider": "searxng"
  },
  "core_services": {
    "openwebui": {
      "task_model_title": "qwen3-0.6b",
      "task_model_tags": "qwen3-4b",
      "rag_top_k": 10,  // User override of default (5)
      "chunk_size": 1500  // Default used (user didn't change)
    }
  }
}
```

### 3. Deployment Flow

```
User Configures WebUI → Saves ReleaseConfig →
  config-generator.ts combines:
    - User's model selections (from ReleaseConfig)
    - User's service selections (from ReleaseConfig)
    - Infrastructure defaults (for values user didn't specify)
  → template-renderer.ts generates quadlets →
  R2 upload → CLI downloads
```

---

## Service Auto-Deployment

Services are deployed based on **user's service selections** (NOT hardcoded defaults):

| User Selection | Auto-Deployed Services |
|----------------|------------------------|
| `rag_provider: qdrant` | qdrant.container |
| `web_search_provider: searxng` | searxng.container, searxng-redis.container |
| `stt_provider: whisper` OR `stt_engine: openai` | whisper.container |
| `tts_provider: edgetts` OR `tts_engine: openai` | edgetts.container |
| `code_execution_provider: jupyter` | jupyter.container |
| `content_extraction: tika` | tika.container |
| `image_engine: comfyui` | comfyui.container |

**Core services** (always deployed):
- caddy, cockpit
- openwebui, openwebui-postgres, openwebui-redis
- litellm, litellm-postgres, litellm-redis
- llama-swap

---

## WebUI Integration Points

### 1. Model Selection UI
- Fetch available models from model catalog API
- Display models grouped by provider (OpenAI, Anthropic, Google, Local)
- Allow multi-select for chat models
- Show requirements (API keys needed, GPU needed, etc.)
- NO defaults selected - user must choose

### 2. Service Selection UI
- Show available services (RAG, search, audio, etc.)
- For each category, show provider options
- Example: RAG → [pgvector, qdrant, chroma, milvus]
- User selects ONE provider per category (or none)

### 3. Infrastructure Settings UI
- Pre-populate forms with values from `DEFAULT_PROVIDER_CONFIGS`
- Show current value vs. default value
- Allow user to override any value
- "Reset to default" button for each field

### 4. Validation
- Frontend validates before save:
  - At least one chat model selected
  - If RAG enabled, at least one embedding model selected
  - API keys provided for cloud models
- Backend validates on deployment:
  - Models must be selected
  - Required dependencies met (RAG → embedding model)

---

## Example User Workflow

### New User (Minimal Configuration)

1. **Create Release** → Name: "Production", Version: "1.0.0"
2. **Select Models:**
   - Chat: Local qwen3-4b, Local qwen3-20b
   - Embedding: qwen3-embedding-8b
   - Task: qwen3-0.6b (title), qwen3-4b (tags)
3. **Select Services:**
   - RAG: pgvector (uses existing postgres)
   - Search: searxng
   - Audio STT: whisper
   - Audio TTS: edgetts
   - Code: jupyter
4. **Infrastructure Settings:**
   - All pre-filled with defaults
   - User doesn't change anything
5. **Save & Deploy**

**Result:**
- 16 services deployed
- All using local models (no API keys needed)
- Full functionality (RAG, search, audio, code)
- Infrastructure settings use sensible defaults

### Advanced User (Cloud Models)

1. **Create Release**
2. **Select Models:**
   - Chat: GPT-5, Claude Sonnet 4.5, Gemini 2.5 Flash
   - Embedding: qwen3-embedding-8b (local, privacy)
   - Task: qwen3-4b (more powerful than default)
3. **Select Services:**
   - RAG: qdrant (best performance)
   - Search: tavily (cloud API, better results)
4. **Add API Keys in Secrets:**
   - OPENAI_API_KEY
   - ANTHROPIC_API_KEY
   - GEMINI_API_KEY
   - TAV ILY_API_KEY
5. **Infrastructure Settings:**
   - RAG top_k: 10 (override default 5)
   - Chunk size: 2000 (override default 1500)
6. **Save & Deploy**

**Result:**
- Cloud models available
- Qdrant deployed for best vector search
- Custom RAG settings
- Tavily for premium search

---

## Success Criteria

### ✅ Achieved

1. **NO hardcoded models** - System is model-agnostic
2. **Infrastructure defaults** - Sensible defaults for settings
3. **User-driven selection** - All models/providers chosen by user
4. **Automatic service deployment** - Based on user selections
5. **Override capability** - User can change any default

### ✅ Benefits

1. **Respects user choice** - WebUI model selection is meaningful
2. **Reduces configuration burden** - Infrastructure pre-configured
3. **Flexible** - Works with any model catalog
4. **Maintainable** - No hardcoded model names to update
5. **Future-proof** - New models/providers added without code changes

---

## Files Modified

```
New Files:
  + api/config/default-provider-configs.ts  (infrastructure settings)
  + api/config/defaults.ts                  (barrel export)

Modified Files:
  ± api/services/config-generator.ts         (uses infrastructure defaults)
  ± api/services/template-renderer.ts        (service auto-deployment)

Updated Files:
  ± QUADLET_INVESTIGATION.md                 (this file)
  ± docs/DEFAULT_CONFIGURATION.md            (updated documentation)
  ± examples/customized-release-config.json  (example)
```

---

## Next Steps

### 1. WebUI Implementation
- Model selection UI (browse catalog, multi-select)
- Service selection UI (choose providers per category)
- Infrastructure settings UI (pre-filled forms with defaults)
- Validation (models required, dependencies checked)

### 2. Model Catalog API
- Endpoint to fetch available models
- Grouped by provider, type (chat/embedding/task)
- Include metadata (requires API key, GPU, etc.)

### 3. Documentation
- User guide for Release Wizard
- Examples of common configurations
- Troubleshooting guide

---

## Conclusion

This implementation provides the best of both worlds:

1. **Smart infrastructure defaults** - Users don't configure timeouts, chunk sizes, etc.
2. **User-driven model selection** - Respects the WebUI's purpose
3. **Flexible architecture** - Works with any model/provider
4. **Easy to maintain** - No hardcoded model names

The system is now ready for the initial release with a high-quality default experience that respects user choice.

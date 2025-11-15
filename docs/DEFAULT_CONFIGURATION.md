# Infrastructure Default Configuration Guide

This document describes the infrastructure-level default configuration system that reduces configuration burden while respecting user choice for model selection.

---

## Overview

The Leger platform provides sensible defaults for **infrastructure settings** (RAG parameters, timeouts, log levels) while requiring users to **explicitly select models** through the WebUI.

### Key Principles

1. **✅ Infrastructure Defaults** - Chunk sizes, timeouts, log levels pre-configured
2. **❌ NO Model Defaults** - Users select all models through WebUI
3. **✅ UI Pre-Population** - Forms pre-filled with suggested values
4. **❌ NO Backend Injection** - Deployment uses only user's configuration

---

## What Has Defaults

### Infrastructure Settings (Pre-Configured)

**RAG Configuration:**
```typescript
{
  rag_top_k: 5,                    // Number of chunks to retrieve
  chunk_size: 1500,                // Characters per chunk
  chunk_overlap: 100,              // Overlap between chunks
  pdf_extract_images: true         // Extract images from PDFs
}
```

**Security Settings:**
```typescript
{
  rag_embedding_trust_remote_code: false,    // Don't execute untrusted code
  rag_reranking_trust_remote_code: false,
  rag_embedding_auto_update: false,          // Don't auto-update models
  rag_reranking_auto_update: false
}
```

**Performance Settings:**
```typescript
{
  openwebui_timeout_start: 900,    // 15 minutes for first-time downloads
  log_level: 'INFO',               // Default logging level
  autocomplete_input_max_length: 200
}
```

**Branding:**
```typescript
{
  webui_name: 'Leger AI',
  default_locale: 'en-US',
  redis_key_prefix: 'open-webui'
}
```

**Service-Specific (Qdrant, Chroma):**
```typescript
{
  // Qdrant
  qdrant_grpc_port: 6334,
  qdrant_prefer_grpc: false,
  qdrant_on_disk: true,

  // Chroma
  chroma_tenant: 'default_tenant',
  chroma_database: 'default_database'
}
```

### Alternative Presets

**Performance-Optimized** (faster, less accurate):
```typescript
{
  rag_top_k: 3,
  chunk_size: 1000,
  chunk_overlap: 50
}
```

**Quality-Optimized** (slower, more accurate):
```typescript
{
  rag_top_k: 10,
  chunk_size: 2000,
  chunk_overlap: 200
}
```

---

## What Does NOT Have Defaults

###User Must Select Through WebUI

**❌ NO Default Models:**
- Chat models (GPT-5, Claude 4.5, local models, etc.)
- Embedding models (for RAG)
- Task models (for titles, tags, autocomplete)

**❌ NO Default Providers:**
- LLM API providers (OpenAI, Anthropic, Google, etc.)
- Vector databases (pgvector, qdrant, chroma)
- Search engines (searxng, tavily, brave, etc.)
- Audio providers (whisper, edgetts, etc.)

**❌ NO Default Features:**
- RAG enablement
- Web search enablement
- Image generation enablement
- Code execution enablement

---

## How Users Configure the System

### Step 1: Model Selection (REQUIRED)

User must select models through WebUI:

**Chat Models:**
- Browse model catalog
- Select from: GPT-5, Claude 4.5, Gemini 2.5, local models, etc.
- Multi-select allowed
- At least ONE required

**Embedding Models (if RAG enabled):**
- Select embedding model (e.g., qwen3-embedding-8b)
- Required if vector database selected

**Task Models (optional but recommended):**
- Title generation model (fast, small)
- Tags generation model (balanced)
- Autocomplete model (ultra-fast)
- Query model (for RAG/search)

### Step 2: Service Selection

User selects services/providers:

**Vector Database (for RAG):**
- Options: pgvector, qdrant, chroma, milvus
- If selected, RAG is automatically enabled

**Web Search:**
- Options: searxng, tavily, brave, duckduckgo, google
- If selected, web search is automatically enabled

**Audio:**
- STT: whisper, azure, deepgram
- TTS: edgetts, azure, elevenlabs

**Code Execution:**
- Options: jupyter, pyodide

**Image Generation:**
- Options: comfyui, openai (DALL-E), automatic1111

### Step 3: Infrastructure Settings (Optional)

Forms pre-populated with defaults from `api/config/default-provider-configs.ts`:

**User can:**
- Keep defaults (most common)
- Override any value
- Use preset profiles (performance, quality)
- Reset to default

**Example Overrides:**
```json
{
  "core_services": {
    "openwebui": {
      "rag_top_k": 10,          // Override default (5)
      "chunk_size": 2000,       // Override default (1500)
      "log_level": "DEBUG"      // Override default ("INFO")
    }
  }
}
```

---

## Configuration Examples

### Example 1: Minimal (Local Models, Full Features)

**User selects:**
```json
{
  "model_assignments": {
    "primary_chat_models": ["local/qwen3-4b", "local/qwen3-20b"],
    "embedding_models": ["qwen3-embedding-8b"]
  },
  "service_selections": {
    "rag_provider": "pgvector",          // Uses existing postgres
    "web_search_provider": "searxng",    // Free, local
    "stt_provider": "whisper",           // Free, local
    "tts_provider": "edgetts",           // Free, local
    "code_execution_provider": "jupyter" // Free, local
  },
  "core_services": {}  // All defaults used
}
```

**Result:**
- 16 services deployed
- All local (no API keys needed)
- Full functionality (RAG, search, audio, code)
- All infrastructure settings use defaults

### Example 2: Cloud Models with Custom Settings

**User selects:**
```json
{
  "model_assignments": {
    "primary_chat_models": [
      "openai/gpt-5",
      "anthropic/claude-sonnet-4-5",
      "gemini/gemini-2.5-flash"
    ],
    "embedding_models": ["qwen3-embedding-8b"]  // Local for privacy
  },
  "service_selections": {
    "rag_provider": "qdrant",           // Best performance
    "web_search_provider": "tavily"     // Cloud API, better results
  },
  "core_services": {
    "openwebui": {
      "rag_top_k": 10,                 // Quality over speed
      "chunk_size": 2000,
      "chunk_overlap": 200,
      "log_level": "DEBUG"             // Detailed logging
    }
  }
}
```

**User adds API keys in Secrets:**
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- TAVILY_API_KEY

**Result:**
- Cloud models available
- Qdrant deployed for best vector search
- Custom RAG settings (quality-optimized)
- Tavily for premium search

---

## Service Auto-Deployment

Services are automatically deployed based on user's selections:

| User Selects | Auto-Deployed Services |
|--------------|------------------------|
| `rag_provider: qdrant` | qdrant.container |
| `rag_provider: pgvector` | (uses existing openwebui-postgres) |
| `web_search_provider: searxng` | searxng.container, searxng-redis.container |
| `stt_provider: whisper` | whisper.container |
| `tts_provider: edgetts` | edgetts.container |
| `code_execution_provider: jupyter` | jupyter.container |
| `content_extraction: tika` | tika.container |
| `image_engine: comfyui` | comfyui.container |

**Core services** (always deployed):
- caddy, cockpit
- openwebui, openwebui-postgres, openwebui-redis
- litellm, litellm-postgres, litellm-redis
- llama-swap

---

## Validation

### Frontend Validation (Before Save)
- ✅ At least one chat model selected
- ✅ If RAG enabled, at least one embedding model selected
- ✅ Subdomain uniqueness
- ✅ Valid configuration values (ranges, types)

### Backend Validation (On Deployment)
- ✅ Models must be selected
- ✅ Tailscale configuration exists
- ✅ Required dependencies met (RAG → embedding model)
- ⚠️ Warnings for missing API keys (cloud models won't work)

---

## WebUI Integration

### 1. Model Selection UI

```
┌─────────────────────────────────────────────┐
│ Select Chat Models (Required)              │
├─────────────────────────────────────────────┤
│ □ OpenAI GPT-5        [requires API key]    │
│ □ Claude Sonnet 4.5   [requires API key]    │
│ □ Gemini 2.5 Flash    [requires API key]    │
│ ☑ Local Qwen3-4B      [no API key needed]   │
│ ☑ Local Qwen3-20B     [no API key needed]   │
└─────────────────────────────────────────────┘
```

### 2. Infrastructure Settings UI

```
┌─────────────────────────────────────────────┐
│ RAG Settings                                │
├─────────────────────────────────────────────┤
│ Top K:           [5     ] ← Default        │
│ Chunk Size:      [1500  ] ← Default        │
│ Chunk Overlap:   [100   ] ← Default        │
│                                             │
│ [Reset to Defaults] [Use Quality Preset]   │
└─────────────────────────────────────────────┘
```

### 3. Presets

```
┌─────────────────────────────────────────────┐
│ Configuration Presets                       │
├─────────────────────────────────────────────┤
│ ○ Default       (balanced)                  │
│ ○ Performance   (faster, less accurate)     │
│ ○ Quality       (slower, more accurate)     │
│ ● Custom        (your overrides)            │
└─────────────────────────────────────────────┘
```

---

## Configuration Hierarchy

Settings are applied in this order (lowest to highest priority):

1. **Hardcoded defaults** (`api/config/default-provider-configs.ts`)
2. **User overrides** (`ReleaseConfig.core_services`)
3. **Infrastructure overrides** (`ReleaseConfig.infrastructure.services`)

**Example:**
```typescript
// 1. Default (hardcoded)
rag_top_k: 5

// 2. User override in core_services
"core_services": {
  "openwebui": {
    "rag_top_k": 10  // ← This wins
  }
}

// Result: rag_top_k = 10
```

---

## Summary

### For Users

**Required Steps:**
1. ✅ Select chat models (at least one)
2. ✅ Select services (RAG, search, etc.) - optional but recommended
3. ✅ Select embedding models (if RAG enabled)
4. ⚠️ Add API keys (if using cloud models)

**Optional Steps:**
- Override infrastructure settings (most users keep defaults)
- Select task models (defaults available in UI)
- Use preset configurations (performance vs. quality)

### For Developers

**Backend provides:**
- Infrastructure defaults for all settings
- Service auto-deployment based on selections
- Validation of user configuration
- NO model defaults or injections

**Frontend should:**
- Present model catalog for selection
- Pre-populate forms with defaults
- Show "current vs. default" for settings
- Validate before save
- Suggest recommended configurations

---

## Next Steps

1. **Implement WebUI:**
   - Model catalog API and selection UI
   - Service selection UI with provider options
   - Infrastructure settings forms with defaults
   - Validation and dependency checking

2. **Add Presets:**
   - "Quick Start" - local models, full features
   - "Performance" - fast models, optimized settings
   - "Quality" - best models, accuracy-first settings
   - "Minimal" - local models, basic features

3. **Documentation:**
   - User guide for Release Wizard
   - Model selection best practices
   - Troubleshooting common issues

---

## Conclusion

This system provides the best user experience by:

1. **Reducing configuration burden** - Infrastructure pre-configured
2. **Respecting user choice** - All models selected by user
3. **Maintaining flexibility** - Any default can be overridden
4. **Future-proofing** - New models/providers added without code changes

Users get a high-quality default experience while maintaining full control over their deployment.

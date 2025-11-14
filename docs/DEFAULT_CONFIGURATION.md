# Default Configuration Guide

This document describes the comprehensive default configuration system that enables **zero-configuration deployment** for novice users while allowing **full customization** for advanced users.

---

## Overview

The Leger platform now provides intelligent defaults for:
- **Models** (local & cloud)
- **Providers** (vector DB, search, audio, code execution)
- **Provider Configurations** (all environment variables & settings)

This means **novice users can deploy without setting a single environment variable**, and the platform will "just work" with sensible defaults.

---

## Default Models

### Local Models (No API Keys Required)

**Chat Models:**
- `gpt-oss-20b` - Fast general-purpose model (20B params, Q4_K_M)
- `gpt-oss-120b` - Powerful reasoning model (120B params, Q4_K_M)

**Embedding Models:**
- `qwen3-embedding-8b` - High-quality embeddings (8B params, Q8_0)

**Task Models:**
- `qwen3-0.6b` - Ultra-fast for titles, autocomplete (0.6B params)
- `qwen3-4b` - Balanced for tags, queries, analysis (4B params)

### Cloud Models (Requires API Keys, Disabled by Default)

**OpenAI GPT-5 Family:**
- `openai/gpt-5` - Flagship model (400K context)
- `openai/gpt-5-mini` - Cost-efficient (80% cheaper)
- `openai/gpt-5-nano` - Ultra-fast (96% cheaper)

**Anthropic Claude 4.x:**
- `anthropic/claude-sonnet-4-5` - Hybrid reasoning, 30+ hour autonomy
- `anthropic/claude-opus-4-1` - Most powerful, 7-hour memory

**Google Gemini 2.5:**
- `gemini/gemini-2.5-flash` - Fast, 1M+ context
- `gemini/gemini-2.5-pro` - Most powerful, 2M context

---

## Default Providers

The platform automatically selects providers optimized for:
- ✅ Minimal resource usage
- ✅ Maximum functionality
- ✅ Privacy (local-first)
- ✅ Cost (free/self-hosted)

| Category | Default Provider | Rationale |
|----------|-----------------|-----------|
| **Vector DB** | `pgvector` | Uses existing Postgres, no extra service |
| **RAG Embedding** | `openai` | Points to llama-swap (local) |
| **Content Extraction** | `tika` | Lightweight, comprehensive |
| **Text Splitter** | `recursive` | Better for varied content |
| **Web Search** | `searxng` | Privacy-respecting metasearch |
| **Web Loader** | `requests` | Lightweight, no browser |
| **STT** | `openai` | Points to Whisper container |
| **TTS** | `openai` | Points to EdgeTTS container |
| **Code Execution** | `jupyter` | Full Python environment |
| **Storage** | `local` | No cloud dependencies |
| **Auth** | `local` | Tailscale provides network security |

### Alternative Providers

Advanced users can override defaults with:

**Vector Database:**
- `pgvector` (default) - PostgreSQL extension
- `chroma` - Embedded, no extra service
- `qdrant` - Dedicated vector DB (best performance)
- `milvus` - Enterprise-grade
- `opensearch` - Full-text + vector

**Web Search:**
- `searxng` (default) - Privacy-focused
- `tavily` - Cloud API (requires key)
- `brave` - Cloud API (requires key)
- `duckduckgo` - Free, no key
- `google_pse` - Cloud API (requires key)

**Audio (STT):**
- `openai` (default) - Local Whisper container
- `azure` - Cloud (requires key)
- `deepgram` - Cloud (requires key)

**Audio (TTS):**
- `openai` (default) - Local EdgeTTS container
- `azure` - Cloud (requires key)
- `elevenlabs` - Cloud (requires key)
- `transformers` - Local (slower)

**Image Generation:**
- `null` (default) - Disabled (resource intensive)
- `openai` - Cloud DALL-E
- `comfyui` - Local Stable Diffusion
- `automatic1111` - Local SD (alternative)

---

## Default Provider Configurations

All provider-specific settings have sensible defaults:

### OpenWebUI Core

```json
{
  "webui_name": "Leger AI",
  "custom_name": "",
  "default_locale": "en-US",
  "log_level": "INFO"
}
```

### RAG Settings

```json
{
  "rag_top_k": 5,
  "chunk_size": 1500,
  "chunk_overlap": 100,
  "pdf_extract_images": true,
  "rag_embedding_model": "qwen3-embedding-8b"
}
```

### Task Models

```json
{
  "task_model_title": "qwen3-0.6b",
  "task_model_autocomplete": "qwen3-0.6b",
  "task_model_tags": "qwen3-4b",
  "task_model_query": "qwen3-4b",
  "task_model_search_query": "qwen3-4b",
  "task_model_rag_template": "qwen3-4b"
}
```

### Audio Settings

```json
{
  "audio_stt_model": "whisper-1",
  "audio_tts_model": "tts-1",
  "audio_tts_voice": "alloy"
}
```

### Security Settings

```json
{
  "rag_embedding_trust_remote_code": false,
  "rag_reranking_trust_remote_code": false,
  "rag_embedding_auto_update": false,
  "rag_reranking_auto_update": false
}
```

---

## Minimal Configuration Example

For a **novice user**, this minimal configuration is sufficient:

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

**This will automatically deploy:**
- ✅ OpenWebUI at `https://ai.tailnet.ts.net`
- ✅ LiteLLM with local models (gpt-oss-20b, gpt-oss-120b)
- ✅ RAG with pgvector + local embeddings + Tika
- ✅ Web search with SearXNG
- ✅ Speech-to-text with Whisper
- ✅ Text-to-speech with EdgeTTS
- ✅ Code execution with Jupyter
- ✅ All infrastructure (Postgres, Redis, Caddy, Cockpit)

**Total services deployed: 16**
**Configuration fields required: 6** (minimal metadata + subdomains)
**Environment variables set by user: 0**

---

## Customization Examples

### Override Task Models (Performance → Quality)

```json
{
  "core_services": {
    "openwebui": {
      "task_model_title": "qwen3-4b",
      "task_model_tags": "qwen3-8b",
      "task_model_autocomplete": "qwen3-4b",
      "task_model_query": "qwen3-8b"
    }
  }
}
```

### Override RAG Settings (Default → Quality-Optimized)

```json
{
  "core_services": {
    "openwebui": {
      "rag_top_k": 10,
      "chunk_size": 2000,
      "chunk_overlap": 200
    }
  }
}
```

### Switch Vector DB (pgvector → Qdrant)

```json
{
  "service_selections": {
    "rag_provider": "qdrant"
  }
}
```

This will:
- ✅ Auto-deploy Qdrant container
- ✅ Auto-configure OpenWebUI to use Qdrant
- ✅ Auto-set QDRANT_URI, QDRANT_GRPC_PORT, etc.

### Add Cloud Models (Local → OpenAI GPT-5)

```json
{
  "model_assignments": {
    "primary_chat_models": [
      "openai/gpt-5",
      "openai/gpt-5-mini"
    ]
  }
}
```

Then add API key in Secrets:
```bash
# Via CLI
leger secrets set OPENAI_API_KEY sk-...

# Via UI
Settings → Secrets → Add Secret
```

---

## Service Auto-Deployment

Services are automatically deployed based on provider selections:

| Provider | Auto-Deployed Services |
|----------|----------------------|
| `vector_db: qdrant` | qdrant.container |
| `web_search_engine: searxng` | searxng.container, searxng-redis.container |
| `stt_engine: openai` | whisper.container |
| `tts_engine: openai` | edgetts.container |
| `code_execution_engine: jupyter` | jupyter.container |
| `content_extraction: tika` | tika.container |
| `image_engine: comfyui` | comfyui.container |

**Core services** (always deployed):
- caddy, cockpit
- openwebui, openwebui-postgres, openwebui-redis
- litellm, litellm-postgres, litellm-redis
- llama-swap

---

## Alternative Configuration Profiles

For quick customization, use these alternative profiles:

### Minimal (Resource-Constrained)

```json
{
  "core_services": {
    "openwebui": {
      "task_model_title": "qwen3-0.6b",
      "task_model_tags": "qwen3-0.6b",
      "task_model_autocomplete": "qwen3-0.6b",
      "task_model_query": "qwen3-0.6b"
    }
  }
}
```

### Power-User (Best Quality)

```json
{
  "core_services": {
    "openwebui": {
      "task_model_title": "qwen3-4b",
      "task_model_tags": "qwen3-8b",
      "task_model_autocomplete": "qwen3-4b",
      "task_model_query": "qwen3-8b",
      "rag_top_k": 10,
      "chunk_size": 2000,
      "chunk_overlap": 200
    }
  },
  "service_selections": {
    "rag_provider": "qdrant"
  }
}
```

### Performance (Speed-Optimized)

```json
{
  "core_services": {
    "openwebui": {
      "rag_top_k": 3,
      "chunk_size": 1000,
      "chunk_overlap": 50
    }
  }
}
```

---

## Feature Inference

Features are automatically enabled based on provider selections:

| Feature | Enabled When |
|---------|-------------|
| RAG | `providers.vector_db` is set |
| Web Search | `providers.web_search_engine` is set |
| Image Generation | `providers.image_engine` is set |
| STT | `providers.stt_engine` is set |
| TTS | `providers.tts_engine` is set |
| Code Execution | `providers.code_execution_engine` is set |

**Example:**
```json
{
  "service_selections": {
    "web_search_provider": "searxng"
  }
}
```

This automatically:
1. Sets `providers.web_search_engine = "searxng"`
2. Sets `features.web_search_enabled = true`
3. Deploys `searxng.container` + `searxng-redis.container`
4. Configures `SEARXNG_QUERY_URL` in OpenWebUI

**Zero additional configuration required!**

---

## Configuration Hierarchy

The system follows this override hierarchy (lowest to highest priority):

1. **Hardcoded defaults** (in `api/config/default-*.ts`)
2. **User release config** (in `ReleaseConfig.core_services`)
3. **User infrastructure overrides** (in `ReleaseConfig.infrastructure.services`)
4. **User secrets** (API keys, passwords)

**Example:**
```json
{
  "core_services": {
    "openwebui": {
      "webui_name": "My Company AI"  // Overrides default "Leger AI"
    }
  }
}
```

---

## Validation

The system validates configurations and provides helpful feedback:

**Errors** (prevent deployment):
- Missing Tailscale configuration
- Duplicate subdomains
- Invalid configuration values

**Warnings** (informational):
- RAG enabled without custom embedding models (defaults will be used)
- Missing API keys for cloud models (models will be unavailable)

**Info** (helpful messages):
- "Using default models: gpt-oss-20b, gpt-oss-120b"
- "Using default embedding model: qwen3-embedding-8b"
- "Auto-deploying services: tika, searxng, whisper, edgetts, jupyter"

---

## Summary

### For Novice Users

**Required configuration:**
- ✅ Tailscale hostname (one-time setup)
- ✅ Release metadata (name, version)
- ✅ Caddy subdomains (3 values)

**Total: 5-6 fields**
**Environment variables: 0**
**Services deployed: 16**
**Full functionality: ✅**

### For Advanced Users

**Full customization available:**
- ✅ Override any default
- ✅ Add cloud models
- ✅ Switch providers
- ✅ Fine-tune settings
- ✅ Enable/disable features granularly

**Customization path:**
- Start with defaults
- Override incrementally
- Full control when needed

---

## Next Steps

1. **Create a minimal release** using `examples/minimal-release-config.json`
2. **Deploy and test** - verify all services start correctly
3. **Add customizations** incrementally as needed
4. **Add cloud models** by providing API keys in Secrets

For more examples, see:
- `examples/minimal-release-config.json` - Zero-config deployment
- `examples/customized-release-config.json` - Advanced customization

For implementation details, see:
- `QUADLET_INVESTIGATION.md` - Full architectural analysis
- `api/config/default-models.ts` - Model catalog
- `api/config/default-providers.ts` - Provider selections
- `api/config/default-provider-configs.ts` - Provider configurations

/**
 * Release Configuration Types
 * Based on release-schema.json - represents the "last mile" configuration
 */

export interface ReleaseMetadata {
  name: string;
  version: string;
  description?: string;
  tags?: string[];
}

export interface OpenWebUIConfig {
  webui_name?: string;
  custom_name?: string;
  enable_signup?: boolean;
  enable_community_sharing?: boolean;
  enable_message_rating?: boolean;
  rag_top_k?: number;
  chunk_size?: number;
  chunk_overlap?: number;
  pdf_extract_images?: boolean;
  enable_image_generation?: boolean;
  enable_web_search?: boolean;
  enable_rag?: boolean;
  task_model_title?: string;
  task_model_tags?: string;
  task_model_autocomplete?: string;
  task_model_query?: string;
  task_model_search_query?: string;
  task_model_rag_template?: string;
  log_level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  redis_key_prefix?: string;
  timeout_start?: number;
}

export interface LiteLLMConfig {
  enable_prometheus?: boolean;
  enable_request_logging?: boolean;
  cache_type?: 'redis' | 'none';
}

export interface LlamaSwapConfig {
  auto_unload_enabled?: boolean;
  auto_unload_timeout?: number;
  max_concurrent_models?: number;
  gpu_memory_fraction?: number;
}

export interface CoreServices {
  openwebui?: OpenWebUIConfig;
  litellm?: LiteLLMConfig;
  llama_swap?: LlamaSwapConfig;
}

export interface CaddyRoutes {
  openwebui_subdomain: string;
  litellm_subdomain: string;
  llama_swap_subdomain: string;
  cockpit_subdomain?: string;
  qdrant_subdomain?: string;
  searxng_subdomain?: string;
  comfyui_subdomain?: string;
  whisper_subdomain?: string;
  jupyter_subdomain?: string;
}

export interface ServiceSelections {
  rag_provider?: string;
  web_search_provider?: string;
  image_generation_provider?: string;
  stt_provider?: string;
  tts_provider?: string;
  code_execution_provider?: string;
  storage_provider?: string;
  extraction_provider?: string;
}

export interface ModelAssignments {
  primary_chat_models: string[];
  embedding_models?: string[];
}

export interface NetworkConfig {
  name: string;
  subnet: string;
}

export interface InfrastructureConfig {
  network: NetworkConfig;
}

/**
 * Complete release configuration
 */
export interface ReleaseConfig {
  release_metadata: ReleaseMetadata;
  core_services: CoreServices;
  caddy_routes: CaddyRoutes;
  service_selections: ServiceSelections;
  model_assignments: ModelAssignments;
  infrastructure: InfrastructureConfig;
}

/**
 * Tailscale configuration (stored separately in Settings)
 */
export interface TailscaleConfig {
  full_hostname: string;
  hostname?: string;
  tailnet?: string;
}

/**
 * Complete user configuration (generated output)
 * Combines Release + Settings + Marketplace + Models
 * Note: Secrets are managed separately via Podman Secrets, not in configuration
 */
export interface UserConfig {
  tailscale: TailscaleConfig;
  infrastructure: {
    network: NetworkConfig;
    services: Record<string, any>;
  };
  features: Record<string, boolean>;
  providers: Record<string, string>;
  provider_config: Record<string, any>;
}
